const axios = require('axios');
const { Client } = require('ssh2');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

// RunPod API configuration
const RUNPOD_API_URL = 'https://api.runpod.io/graphql';
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_POD_ID = process.env.RUNPOD_POD_ID;

/**
 * Make GraphQL request to RunPod API
 */
const makeRunPodRequest = async (query, variables = {}) => {
  if (!RUNPOD_API_KEY) {
    throw new Error('RUNPOD_API_KEY not configured');
  }

  try {
    const response = await axios.post(
      RUNPOD_API_URL,
      {
        query,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RUNPOD_API_KEY}`,
        },
      }
    );

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  } catch (error) {
    logger.error('RunPod API request failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Execute SSH command on pod
 */
const executeSSHCommand = async (host, port, privateKeyPath, command) => {
  return new Promise(async (resolve, reject) => {
    try {
      const privateKey = await fs.readFile(privateKeyPath, 'utf8');
      const conn = new Client();
      
      conn.on('ready', () => {
        logger.info('SSH connection established');
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          
          let stdout = '';
          let stderr = '';
          
          stream.on('close', (code, signal) => {
            conn.end();
            if (code === 0) {
              resolve({ stdout, stderr, code });
            } else {
              reject(new Error(`Command failed with code ${code}: ${stderr}`));
            }
          });
          
          stream.on('data', (data) => {
            stdout += data.toString();
          });
          
          stream.stderr.on('data', (data) => {
            stderr += data.toString();
          });
        });
      });
      
      conn.on('error', (err) => {
        reject(err);
      });
      
      conn.connect({
        host,
        port: port || 22,
        username: 'root',
        privateKey,
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get pod status and details
 */
exports.getPodStatus = async (podId = RUNPOD_POD_ID) => {
  if (!podId) {
    throw new Error('Pod ID not configured');
  }

  const query = `
    query Pod($podId: String!) {
      pod(input: { podId: $podId }) {
        id
        name
        imageName
        machineId
        machine {
          gpuDisplayName
        }
        desiredStatus
        costPerHr
        uptimeSeconds
        memoryInGb
        vcpuCount
        volumeInGb
        ports
        podType
      }
    }
  `;

  try {
    const data = await makeRunPodRequest(query, { podId });
    return data.pod;
  } catch (error) {
    logger.error('Failed to get pod status:', error);
    throw error;
  }
};

/**
 * Start a stopped pod
 */
exports.startPod = async (podId = RUNPOD_POD_ID) => {
  if (!podId) {
    throw new Error('Pod ID not configured');
  }

  const mutation = `
    mutation StartPod($podId: String!) {
      podResume(input: { podId: $podId }) {
        id
        desiredStatus
        imageName
        costPerHr
      }
    }
  `;

  try {
    const data = await makeRunPodRequest(mutation, { podId });
    logger.info('Pod started successfully:', { podId, data: data.podResume });
    return data.podResume;
  } catch (error) {
    logger.error('Failed to start pod:', error);
    throw error;
  }
};

/**
 * Stop a running pod
 */
exports.stopPod = async (podId = RUNPOD_POD_ID) => {
  if (!podId) {
    throw new Error('Pod ID not configured');
  }

  const mutation = `
    mutation StopPod($podId: String!) {
      podStop(input: { podId: $podId }) {
        id
        desiredStatus
        imageName
      }
    }
  `;

  try {
    const data = await makeRunPodRequest(mutation, { podId });
    logger.info('Pod stopped successfully:', { podId, data: data.podStop });
    return data.podStop;
  } catch (error) {
    logger.error('Failed to stop pod:', error);
    throw error;
  }
};

/**
 * Terminate a pod (permanent deletion)
 */
exports.terminatePod = async (podId = RUNPOD_POD_ID) => {
  if (!podId) {
    throw new Error('Pod ID not configured');
  }

  const mutation = `
    mutation TerminatePod($podId: String!) {
      podTerminate(input: { podId: $podId }) {
        id
      }
    }
  `;

  try {
    const data = await makeRunPodRequest(mutation, { podId });
    logger.warn('Pod terminated permanently:', { podId });
    return data.podTerminate;
  } catch (error) {
    logger.error('Failed to terminate pod:', error);
    throw error;
  }
};

/**
 * Get all pods in account
 */
exports.listAllPods = async () => {
  const query = `
    query Pods {
      myself {
        pods {
          id
          name
          runtime
          desiredStatus
          costPerHr
          uptimeInSeconds
          machine {
            gpuDisplayName
            gpuCount
          }
        }
      }
    }
  `;

  try {
    const data = await makeRunPodRequest(query);
    return data.myself.pods;
  } catch (error) {
    logger.error('Failed to list pods:', error);
    throw error;
  }
};

/**
 * Find the best available pod based on criteria
 */
exports.findBestPod = async () => {
  try {
    const pods = await exports.listAllPods();

    // Filter for running pods
    const runningPods = pods.filter(pod => pod.desiredStatus === 'RUNNING');

    if (runningPods.length === 0) {
      throw new Error('No running pods found');
    }

    // If only one pod is running, use it
    if (runningPods.length === 1) {
      logger.info('Using the only running pod:', runningPods[0].id);
      return runningPods[0];
    }

    // Prioritize by GPU type and cost
    const prioritizedPods = runningPods.sort((a, b) => {
      // Prefer RTX A4500/A5000 GPUs
      const aIsPreferred = a.machine?.gpuDisplayName?.includes('RTX A') || false;
      const bIsPreferred = b.machine?.gpuDisplayName?.includes('RTX A') || false;

      if (aIsPreferred && !bIsPreferred) return -1;
      if (!aIsPreferred && bIsPreferred) return 1;

      // Then by cost (lower cost first)
      return (a.costPerHr || 0) - (b.costPerHr || 0);
    });

    const bestPod = prioritizedPods[0];
    logger.info('Selected best pod:', {
      id: bestPod.id,
      name: bestPod.name,
      gpu: bestPod.machine?.gpuDisplayName,
      cost: bestPod.costPerHr
    });

    return bestPod;
  } catch (error) {
    logger.error('Failed to find best pod:', error);

    // Fallback to hardcoded pod if available
    if (RUNPOD_POD_ID) {
      logger.warn('Falling back to hardcoded pod ID:', RUNPOD_POD_ID);
      try {
        const pod = await exports.getPodStatus(RUNPOD_POD_ID);
        return pod;
      } catch (fallbackError) {
        logger.error('Fallback pod also failed:', fallbackError);
      }
    }

    throw error;
  }
};

/**
 * Get pod ID (either from param, best available, or hardcoded)
 */
exports.getPodId = async (podId = null) => {
  if (podId) {
    return podId;
  }

  try {
    const bestPod = await exports.findBestPod();
    return bestPod.id;
  } catch (error) {
    if (RUNPOD_POD_ID) {
      logger.warn('Using hardcoded pod ID due to pod discovery failure');
      return RUNPOD_POD_ID;
    }
    throw new Error('No pod ID available and pod discovery failed');
  }
};

/**
 * Check if RunPod is configured
 */
exports.isConfigured = () => {
  return !!(RUNPOD_API_KEY && RUNPOD_POD_ID);
};

/**
 * Wait for pod to be ready (running state)
 * @param {number} maxWaitMinutes - Maximum time to wait in minutes
 * @param {number} checkIntervalSeconds - How often to check status
 */
exports.waitForPodReady = async (maxWaitMinutes = 5, checkIntervalSeconds = 10) => {
  const maxAttempts = (maxWaitMinutes * 60) / checkIntervalSeconds;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const pod = await exports.getPodStatus();
      
      if (pod.desiredStatus === 'RUNNING' && pod.runtime) {
        logger.info('Pod is ready:', { podId: pod.id, runtime: pod.runtime });
        return true;
      }

      logger.info(`Waiting for pod to be ready... (${attempts + 1}/${maxAttempts})`, {
        status: pod.desiredStatus,
        runtime: pod.runtime,
      });

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, checkIntervalSeconds * 1000));
      attempts++;
    } catch (error) {
      logger.error('Error checking pod status:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, checkIntervalSeconds * 1000));
    }
  }

  throw new Error(`Pod did not become ready within ${maxWaitMinutes} minutes`);
};

/**
 * Ensure pod is running, start if needed
 * @returns {Promise<boolean>} true if pod is running or was started successfully
 */
exports.ensurePodRunning = async () => {
  if (!exports.isConfigured()) {
    logger.warn('RunPod not configured, skipping pod check');
    return false;
  }

  try {
    const pod = await exports.getPodStatus();

    // If already running, we're good
    if (pod.desiredStatus === 'RUNNING' && pod.runtime) {
      logger.info('Pod is already running');
      return true;
    }

    // If stopped, start it
    if (pod.desiredStatus === 'EXITED' || !pod.runtime) {
      logger.info('Pod is stopped, starting...');
      await exports.startPod();
      
      // Wait for pod to be ready
      logger.info('Waiting for pod to be ready...');
      await exports.waitForPodReady(2, 10); // Wait up to 2 minutes
      
      return true;
    }

    // If starting, wait for it
    if (pod.desiredStatus === 'RUNNING' && !pod.runtime) {
      logger.info('Pod is starting, waiting...');
      await exports.waitForPodReady(2, 10);
      return true;
    }

    return true;
  } catch (error) {
    logger.error('Failed to ensure pod is running:', error);
    throw new Error(`Failed to start GPU pod: ${error.message}`);
  }
};

/**
 * Start AI service on the pod via SSH
 */
/**
 * Check if repository is cloned and clone if necessary
 */
const ensureRepository = async (host, port, privateKeyPath) => {
  logger.info('Checking repository...');
  try {
    // Check if repository directory exists
    const checkRepoCmd = 'test -d /AI_CALL_CENTER && echo "exists" || echo "not_exists"';
    const repoCheck = await executeSSHCommand(host, port, privateKeyPath, checkRepoCmd);

    if (repoCheck.stdout.includes('exists')) {
      logger.info('Repository directory exists, checking if it has content...');
      // Check if ai-service directory exists
      const checkAIService = 'test -d /AI_CALL_CENTER/ai-service && echo "exists" || echo "not_exists"';
      const aiServiceCheck = await executeSSHCommand(host, port, privateKeyPath, checkAIService);

      if (aiServiceCheck.stdout.includes('exists')) {
        logger.info('AI service directory exists');
        return { cloned: true, message: 'Repository already exists' };
      }
    }

    // Repository doesn't exist, clone it
    logger.info('Cloning repository...');

    // Install git if not available
    try {
      await executeSSHCommand(host, port, privateKeyPath, 'which git || apt-get update && apt-get install -y git');
    } catch (error) {
      logger.warn('Git installation failed, but continuing...');
    }

    // Clone the repository
    const cloneCmd = 'git clone https://github.com/NEXT71/AI_CALL_CENTER.git /AI_CALL_CENTER';
    await executeSSHCommand(host, port, privateKeyPath, cloneCmd);

    // Verify clone was successful
    const verifyClone = 'test -f /AI_CALL_CENTER/ai-service/main.py && echo "success" || echo "failed"';
    const verifyResult = await executeSSHCommand(host, port, privateKeyPath, verifyClone);

    if (verifyResult.stdout.includes('success')) {
      logger.info('Repository cloned successfully');
      return { cloned: true, message: 'Repository cloned successfully' };
    } else {
      throw new Error('Repository clone verification failed');
    }

  } catch (error) {
    logger.error('Repository setup failed:', error);
    throw new Error('Failed to clone/setup repository: ' + error.message);
  }
};

/**
 * Create a robust startup script with monitoring and auto-restart
 */
const createStartupScript = async (host, port, privateKeyPath) => {
  logger.info('Creating robust startup script...');

  const startupScript = `#!/bin/bash
# AI Service Startup Script with Auto-Restart
# This script monitors the AI service and restarts it if it crashes

SERVICE_NAME="ai-service"
SERVICE_DIR="/AI_CALL_CENTER/ai-service"
LOG_DIR="/tmp"
LOG_FILE="$LOG_DIR/ai-service.log"
PID_FILE="$LOG_DIR/ai-service.pid"
HEALTH_CHECK_INTERVAL=30  # seconds
MAX_RESTARTS=10
RESTART_COUNT=0
LAST_RESTART_TIME=0

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$SERVICE_NAME] $*" >> "$LOG_DIR/service-monitor.log"
}

start_service() {
    log "Starting AI service (attempt $((RESTART_COUNT + 1)))..."

    cd "$SERVICE_DIR" || {
        log "ERROR: Cannot change to service directory $SERVICE_DIR"
        return 1
    }

    # Kill any existing processes
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
            log "Killing old process $OLD_PID"
            kill "$OLD_PID" 2>/dev/null
            sleep 2
            kill -9 "$OLD_PID" 2>/dev/null
        fi
        rm -f "$PID_FILE"
    fi

    # Start the service
    nohup python3 main.py > "$LOG_FILE" 2>&1 &
    SERVICE_PID=$!

    echo $SERVICE_PID > "$PID_FILE"
    log "Service started with PID $SERVICE_PID"

    # Wait a bit and check if it's still running
    sleep 5
    if ! kill -0 "$SERVICE_PID" 2>/dev/null; then
        log "ERROR: Service failed to start properly"
        return 1
    fi

    return 0
}

check_service() {
    if [ ! -f "$PID_FILE" ]; then
        log "PID file not found"
        return 1
    fi

    SERVICE_PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -z "$SERVICE_PID" ]; then
        log "Empty PID file"
        return 1
    fi

    # Check if process is running
    if ! kill -0 "$SERVICE_PID" 2>/dev/null; then
        log "Process $SERVICE_PID is not running"
        return 1
    fi

    # Optional: Check if service is responding (uncomment if you add a health endpoint)
    # if ! curl -f http://localhost:8000/health >/dev/null 2>&1; then
    #     log "Service health check failed"
    #     return 1
    # fi

    return 0
}

monitor_service() {
    log "Starting service monitor..."

    while true; do
        if ! check_service; then
            CURRENT_TIME=$(date +%s)

            # Rate limiting: don't restart more than once per minute
            if [ $((CURRENT_TIME - LAST_RESTART_TIME)) -lt 60 ]; then
                log "Rate limiting restart attempts"
                sleep 10
                continue
            fi

            if [ $RESTART_COUNT -ge $MAX_RESTARTS ]; then
                log "ERROR: Maximum restart attempts ($MAX_RESTARTS) reached. Giving up."
                exit 1
            fi

            log "Service is down, attempting restart..."
            LAST_RESTART_TIME=$CURRENT_TIME
            RESTART_COUNT=$((RESTART_COUNT + 1))

            if start_service; then
                log "Service restarted successfully"
                RESTART_COUNT=0  # Reset counter on successful start
            else
                log "Failed to restart service"
            fi
        else
            # Service is healthy, reset restart counter
            if [ $RESTART_COUNT -gt 0 ]; then
                log "Service is healthy, resetting restart counter"
                RESTART_COUNT=0
            fi
        fi

        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Main execution
log "AI Service Monitor starting..."
log "Service directory: $SERVICE_DIR"
log "Log file: $LOG_FILE"
log "PID file: $PID_FILE"

# Initial start
if start_service; then
    log "Initial service start successful"
else
    log "ERROR: Initial service start failed"
    exit 1
fi

# Start monitoring
monitor_service
`;

  // Create the startup script
  const createScriptCmd = `cat > /usr/local/bin/ai-service-monitor.sh << 'EOF'
${startupScript}
EOF
chmod +x /usr/local/bin/ai-service-monitor.sh`;

  await executeSSHCommand(host, port, privateKeyPath, createScriptCmd);
  logger.info('Startup script created successfully');
};

const checkDependencies = async (host, port, privateKeyPath) => {
  try {
    logger.info('Checking dependencies...');

    // Check Python
    const pythonCheck = await executeSSHCommand(host, port, privateKeyPath, 'python3 --version || python --version');
    logger.info('Python check:', pythonCheck.stdout.trim());

    // Check pip
    const pipCheck = await executeSSHCommand(host, port, privateKeyPath, 'pip --version || pip3 --version');
    logger.info('Pip check:', pipCheck.stdout.trim());

    // Check if key packages are installed
    const torchCheck = await executeSSHCommand(host, port, privateKeyPath, 'python3 -c "import torch; print(torch.__version__)" 2>/dev/null || echo "not_installed"');
    const numpyCheck = await executeSSHCommand(host, port, privateKeyPath, 'python3 -c "import numpy; print(numpy.__version__)" 2>/dev/null || echo "not_installed"');
    const fastapiCheck = await executeSSHCommand(host, port, privateKeyPath, 'python3 -c "import fastapi; print(fastapi.__version__)" 2>/dev/null || echo "not_installed"');

    return {
      python: !pythonCheck.stdout.includes('not found'),
      pip: !pipCheck.stdout.includes('not found'),
      torch: !torchCheck.stdout.includes('not_installed'),
      numpy: !numpyCheck.stdout.includes('not_installed'),
      fastapi: !fastapiCheck.stdout.includes('not_installed')
    };
  } catch (error) {
    logger.error('Dependency check failed:', error);
    return { python: false, pip: false, torch: false, numpy: false, fastapi: false };
  }
};

/**
 * Install system dependencies
 */
const installSystemDeps = async (host, port, privateKeyPath) => {
  logger.info('Installing system dependencies...');
  try {
    await executeSSHCommand(host, port, privateKeyPath, 'apt-get update');
    await executeSSHCommand(host, port, privateKeyPath, 'apt-get install -y ffmpeg python3 python3-pip');
    logger.info('System dependencies installed successfully');
  } catch (error) {
    logger.error('Failed to install system dependencies:', error);
    throw new Error('System dependency installation failed');
  }
};

/**
 * Install Python dependencies
 */
const installPythonDeps = async (host, port, privateKeyPath) => {
  logger.info('Installing Python dependencies...');
  try {
    // Install PyTorch with CUDA support
    await executeSSHCommand(host, port, privateKeyPath,
      'pip install torch==2.4.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cu121'
    );

    // Install NumPy first (critical for compatibility)
    await executeSSHCommand(host, port, privateKeyPath,
      'pip install "numpy<2.0,>=1.26.4"'
    );

    // Install all other dependencies
    await executeSSHCommand(host, port, privateKeyPath,
      'pip install fastapi==0.115.0 uvicorn==0.32.0 python-multipart==0.0.12 python-dotenv==1.0.1 pydantic==2.10.3 transformers==4.47.1 openai-whisper==20250625 librosa==0.10.2.post1 soundfile==0.12.1 pydub==0.25.1 ffmpeg-python==0.2.0 spacy==3.8.3 rapidfuzz==3.10.1 pyannote.audio==3.1.1 pytz==2025.2 psutil==6.1.0'
    );

    // Download Spacy model
    await executeSSHCommand(host, port, privateKeyPath,
      'python3 -m spacy download en_core_web_sm'
    );

    logger.info('Python dependencies installed successfully');
  } catch (error) {
    logger.error('Failed to install Python dependencies:', error);
    throw new Error('Python dependency installation failed');
  }
};

/**
 * Setup environment configuration
 */
const setupEnvironment = async (host, port, privateKeyPath) => {
  logger.info('Setting up environment configuration...');
  try {
    const envContent = `# GPU Configuration
DEVICE=cuda
WHISPER_MODEL=base
MAX_WORKERS=4

# Model Configuration
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
SUMMARIZATION_MODEL=facebook/bart-large-cnn
SPACY_MODEL=en_core_web_sm

# Server Configuration
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=https://ai-call-center-o7d7.vercel.app,https://ai-call-center-pt0v.onrender.com

# RunPod API Configuration
RUNPOD_API_KEY=${process.env.RUNPOD_API_KEY || ''}
RUNPOD_POD_ID=${process.env.RUNPOD_POD_ID || ''}

# HuggingFace Token
HUGGINGFACE_TOKEN=${process.env.HUGGINGFACE_TOKEN || ''}
`;

    // Create .env file
    const createEnvCmd = `cat > /AI_CALL_CENTER/ai-service/.env << 'EOF'
${envContent}
EOF`;

    await executeSSHCommand(host, port, privateKeyPath, createEnvCmd);
    logger.info('Environment configuration created successfully');
  } catch (error) {
    logger.error('Failed to setup environment:', error);
    throw new Error('Environment setup failed');
  }
};

/**
 * Verify installation
 */
const verifyInstallation = async (host, port, privateKeyPath) => {
  logger.info('Verifying installation...');
  try {
    // Test key imports
    const testCmd = `cd /AI_CALL_CENTER/ai-service && python3 -c "
import torch
import numpy as np
import fastapi
import whisper
import librosa
import spacy
print('All imports successful')
print(f'PyTorch CUDA: {torch.cuda.is_available()}')
print(f'NumPy: {np.__version__}')
"`;

    const result = await executeSSHCommand(host, port, privateKeyPath, testCmd);
    if (result.stdout.includes('All imports successful')) {
      logger.info('Installation verification successful');
      return true;
    } else {
      logger.error('Installation verification failed:', result.stderr);
      return false;
    }
  } catch (error) {
    logger.error('Installation verification failed:', error);
    return false;
  }
};

exports.startService = async (podId = RUNPOD_POD_ID) => {
  try {
    const pod = await exports.getPodStatus(podId);

    if (!pod.runtime || !pod.runtime.ports) {
      throw new Error('Pod is not running or has no ports configured');
    }

    // Find SSH port (usually 22)
    const sshPort = pod.runtime.ports.find(p => p.privatePort === 22);
    if (!sshPort) {
      throw new Error('SSH port not found on pod');
    }

    const host = sshPort.ip;
    const port = sshPort.publicPort;
    const privateKeyPath = path.join(__dirname, '../../ai-service/aiservice');

    logger.info('Starting AI service with auto-installation on pod:', { host, port });

    // Check if service is already running
    const checkCmd = 'pgrep -f "python.*main.py" || echo "not_running"';
    const checkResult = await executeSSHCommand(host, port, privateKeyPath, checkCmd);

    if (!checkResult.stdout.includes('not_running')) {
      logger.info('AI service already running');
      return { status: 'already_running', message: 'Service is already running' };
    }

    // Ensure repository is cloned
    const repoResult = await ensureRepository(host, port, privateKeyPath);
    logger.info('Repository check result:', repoResult);

    // Check dependencies
    const deps = await checkDependencies(host, port, privateKeyPath);
    logger.info('Dependency check results:', deps);

    // Install missing dependencies
    if (!deps.python || !deps.pip) {
      logger.info('Installing system dependencies...');
      await installSystemDeps(host, port, privateKeyPath);
    }

    if (!deps.torch || !deps.numpy || !deps.fastapi) {
      logger.info('Installing Python dependencies...');
      await installPythonDeps(host, port, privateKeyPath);
    }

    // Setup environment
    await setupEnvironment(host, port, privateKeyPath);

    // Verify installation
    const verified = await verifyInstallation(host, port, privateKeyPath);
    if (!verified) {
      throw new Error('Installation verification failed - some dependencies may not be working correctly');
    }

    // Create robust startup script
    await createStartupScript(host, port, privateKeyPath);

    // Start the service monitor (which will start and monitor the AI service)
    const startCmd = 'nohup /usr/local/bin/ai-service-monitor.sh > /tmp/service-monitor.log 2>&1 & echo $!';
    const result = await executeSSHCommand(host, port, privateKeyPath, startCmd);

    const monitorPid = result.stdout.trim();
    logger.info('Service monitor started with PID:', monitorPid);

    // Wait a moment and verify the monitor is running
    await new Promise(resolve => setTimeout(resolve, 3000));
    const verifyMonitor = await executeSSHCommand(host, port, privateKeyPath, `ps -p ${monitorPid}`);

    if (verifyMonitor.stdout.includes(monitorPid)) {
      // Wait a bit more and check if the actual service started
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check if the AI service is running
      const checkService = await executeSSHCommand(host, port, privateKeyPath,
        'pgrep -f "python.*main.py" || echo "not_running"');

      if (!checkService.stdout.includes('not_running')) {
        return {
          status: 'started',
          monitorPid,
          message: 'Service started successfully with monitoring and auto-restart',
          installation: 'completed'
        };
      } else {
        throw new Error('Service monitor started but AI service failed to start');
      }
    } else {
      throw new Error('Service monitor failed to start');
    }
  } catch (error) {
    logger.error('Failed to start service:', error);
    throw error;
  }
};

/**
 * Stop AI service on the pod via SSH
 */
exports.stopService = async (podId = RUNPOD_POD_ID) => {
  try {
    const pod = await exports.getPodStatus(podId);
    
    if (!pod.runtime || !pod.runtime.ports) {
      throw new Error('Pod is not running or has no ports configured');
    }
    
    const sshPort = pod.runtime.ports.find(p => p.privatePort === 22);
    if (!sshPort) {
      throw new Error('SSH port not found on pod');
    }
    
    const host = sshPort.ip;
    const port = sshPort.publicPort;
    const privateKeyPath = path.join(__dirname, '../../ai-service/aiservice');
    
    logger.info('Stopping AI service on pod:', { host, port });
    
    // Kill the service monitor and AI service processes
    const stopCmd = 'pkill -f "ai-service-monitor.sh" && pkill -f "python.*main.py" && rm -f /tmp/ai-service.pid && echo "stopped" || echo "not_running"';
    const result = await executeSSHCommand(host, port, privateKeyPath, stopCmd);
    
    if (result.stdout.includes('stopped')) {
      logger.info('AI service and monitor stopped successfully');
      return { status: 'stopped', message: 'Service and monitor stopped successfully' };
    } else {
      return { status: 'not_running', message: 'Service was not running' };
    }
  } catch (error) {
    logger.error('Failed to stop service:', error);
    throw error;
  }
};

/**
 * Get AI service status on the pod
 */
exports.getServiceStatus = async (podId = RUNPOD_POD_ID) => {
  try {
    const pod = await exports.getPodStatus(podId);
    
    if (!pod.runtime || !pod.runtime.ports) {
      return { status: 'pod_not_running', running: false };
    }
    
    const sshPort = pod.runtime.ports.find(p => p.privatePort === 22);
    if (!sshPort) {
      throw new Error('SSH port not found on pod');
    }
    
    const host = sshPort.ip;
    const port = sshPort.publicPort;
    const privateKeyPath = path.join(__dirname, '../../ai-service/aiservice');
    
    // Check if service monitor and AI service are running
    const checkMonitorCmd = 'pgrep -f "ai-service-monitor.sh" || echo "monitor_not_running"';
    const checkServiceCmd = 'pgrep -f "python.*main.py" || echo "service_not_running"';
    
    const [monitorResult, serviceResult] = await Promise.all([
      executeSSHCommand(host, port, privateKeyPath, checkMonitorCmd),
      executeSSHCommand(host, port, privateKeyPath, checkServiceCmd)
    ]);
    
    const monitorRunning = !monitorResult.stdout.includes('monitor_not_running');
    const serviceRunning = !serviceResult.stdout.includes('service_not_running');
    
    if (monitorRunning && serviceRunning) {
      return { status: 'running', running: true, monitor: true, service: true };
    } else if (monitorRunning && !serviceRunning) {
      return { status: 'monitor_running', running: false, monitor: true, service: false };
    } else if (!monitorRunning && serviceRunning) {
      return { status: 'service_running_no_monitor', running: true, monitor: false, service: true };
    } else {
      return { status: 'stopped', running: false, monitor: false, service: false };
    }
  } catch (error) {
    logger.error('Failed to get service status:', error);
    return { status: 'error', running: false, error: error.message };
  }
};
