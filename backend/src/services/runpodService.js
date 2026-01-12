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
    
    logger.info('Starting AI service on pod:', { host, port });
    
    // Check if service is already running
    const checkCmd = 'pgrep -f "python.*main.py" || echo "not_running"';
    const checkResult = await executeSSHCommand(host, port, privateKeyPath, checkCmd);
    
    if (!checkResult.stdout.includes('not_running')) {
      logger.info('AI service already running');
      return { status: 'already_running', message: 'Service is already running' };
    }
    
    // Start the service in background
    const startCmd = 'cd /AI_CALL_CENTER/ai-service && nohup python main.py > /tmp/ai-service.log 2>&1 & echo $!';
    const result = await executeSSHCommand(host, port, privateKeyPath, startCmd);
    
    const pid = result.stdout.trim();
    logger.info('AI service started with PID:', pid);
    
    // Wait a moment and verify it's running
    await new Promise(resolve => setTimeout(resolve, 3000));
    const verifyResult = await executeSSHCommand(host, port, privateKeyPath, `ps -p ${pid}`);
    
    if (verifyResult.stdout.includes(pid)) {
      return { status: 'started', pid, message: 'Service started successfully' };
    } else {
      throw new Error('Service started but process not found');
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
    
    // Kill the Python process
    const stopCmd = 'pkill -f "python.*main.py" && echo "stopped" || echo "not_running"';
    const result = await executeSSHCommand(host, port, privateKeyPath, stopCmd);
    
    if (result.stdout.includes('stopped')) {
      logger.info('AI service stopped successfully');
      return { status: 'stopped', message: 'Service stopped successfully' };
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
    
    // Check if service is running
    const checkCmd = 'pgrep -f "python.*main.py" || echo "not_running"';
    const result = await executeSSHCommand(host, port, privateKeyPath, checkCmd);
    
    if (result.stdout.includes('not_running')) {
      return { status: 'stopped', running: false };
    } else {
      const pid = result.stdout.trim();
      return { status: 'running', running: true, pid };
    }
  } catch (error) {
    logger.error('Failed to get service status:', error);
    return { status: 'error', running: false, error: error.message };
  }
};
