const axios = require('axios');
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
      await exports.waitForPodReady(5, 10); // Wait up to 5 minutes
      
      return true;
    }

    // If starting, wait for it
    if (pod.desiredStatus === 'RUNNING' && !pod.runtime) {
      logger.info('Pod is starting, waiting...');
      await exports.waitForPodReady(5, 10);
      return true;
    }

    return true;
  } catch (error) {
    logger.error('Failed to ensure pod is running:', error);
    throw new Error(`Failed to start GPU pod: ${error.message}`);
  }
};
