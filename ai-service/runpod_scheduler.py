#!/usr/bin/env python3
"""
RunPod Pod Scheduler - Automatically start/stop GPU pods based on schedule
Monday-Saturday, 6:45 PM PKT to 6:00 AM PST
"""

import os
import requests
import json
import time
from datetime import datetime, time, timedelta
import pytz
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# RunPod API Configuration
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
POD_ID = os.getenv("RUNPOD_POD_ID")  # Your pod ID

# Schedule: Monday-Saturday, 6:45 PM PKT to 6:00 AM PST
def is_service_available():
    """Check if service should be running based on schedule"""
    try:
        now_utc = datetime.now(pytz.UTC)
        current_day = now_utc.weekday()  # 0=Monday, 6=Sunday

        # Service only runs Monday-Saturday
        if current_day == 6:  # Sunday
            return False

        # Define time zones
        pkt = pytz.timezone('Asia/Karachi')
        pst = pytz.timezone('US/Pacific')

        # Get today's date in PKT and PST
        today_pkt = now_utc.astimezone(pkt).date()
        today_pst = now_utc.astimezone(pst).date()

        # Start time: 6:45 PM PKT
        start_time_pkt = time(18, 45)
        start_datetime = pkt.localize(datetime.combine(today_pkt, start_time_pkt))

        # End time: 6:00 AM PST (next day)
        end_time_pst = time(6, 0)
        end_datetime = pst.localize(datetime.combine(today_pst, end_time_pst))

        # If end time is before start time, add a day
        if end_datetime <= start_datetime:
            end_datetime = pst.localize(datetime.combine(today_pst + timedelta(days=1), end_time_pst))

        # Convert to UTC for comparison
        start_utc = start_datetime.astimezone(pytz.UTC)
        end_utc = end_datetime.astimezone(pytz.UTC)

        return start_utc <= now_utc <= end_utc

    except Exception as e:
        logger.error(f"Error checking schedule: {e}")
        return False

def get_pod_status():
    """Get current pod status from RunPod API"""
    if not RUNPOD_API_KEY or not POD_ID:
        logger.error("RUNPOD_API_KEY and RUNPOD_POD_ID environment variables required")
        return None

    try:
        url = f"https://api.runpod.io/v1/pod/{POD_ID}"
        headers = {
            "Authorization": f"Bearer {RUNPOD_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        pod_data = response.json()
        return pod_data.get("pod", {}).get("desiredStatus")

    except Exception as e:
        logger.error(f"Error getting pod status: {e}")
        return None

def start_pod():
    """Start the RunPod pod"""
    if not RUNPOD_API_KEY or not POD_ID:
        logger.error("RUNPOD_API_KEY and RUNPOD_POD_ID environment variables required")
        return False

    try:
        url = f"https://api.runpod.io/v1/pod/{POD_ID}/start"
        headers = {
            "Authorization": f"Bearer {RUNPOD_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers, json={})
        response.raise_for_status()

        logger.info("✅ Pod start request sent successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Error starting pod: {e}")
        return False

def stop_pod():
    """Stop the RunPod pod"""
    if not RUNPOD_API_KEY or not POD_ID:
        logger.error("RUNPOD_API_KEY and RUNPOD_POD_ID environment variables required")
        return False

    try:
        url = f"https://api.runpod.io/v1/pod/{POD_ID}/stop"
        headers = {
            "Authorization": f"Bearer {RUNPOD_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers, json={})
        response.raise_for_status()

        logger.info("✅ Pod stop request sent successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Error stopping pod: {e}")
        return False

def manage_pod_schedule():
    """Main function to manage pod based on schedule"""
    should_be_running = is_service_available()
    current_status = get_pod_status()

    logger.info(f"Schedule check - Should run: {should_be_running}, Current status: {current_status}")

    if should_be_running and current_status != "RUNNING":
        logger.info("🚀 Starting pod (scheduled time)")
        start_pod()
        # Wait for pod to start and get IP
        time.sleep(60)  # Wait 1 minute for startup
        # You could add logic here to redeploy your service

    elif not should_be_running and current_status == "RUNNING":
        logger.info("🛑 Stopping pod (outside scheduled time)")
        stop_pod()

    else:
        logger.info("✅ Pod status is correct for current schedule")

def run_scheduler():
    """Run the scheduler continuously"""
    logger.info("🚀 RunPod Pod Scheduler started")
    logger.info("Schedule: Monday-Saturday, 6:45 PM PKT to 6:00 AM PST")

    while True:
        try:
            manage_pod_schedule()
            # Check every 5 minutes
            time.sleep(300)  # 5 minutes

        except KeyboardInterrupt:
            logger.info("🛑 Scheduler stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Scheduler error: {e}")
            time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    # For testing - run once
    if len(os.sys.argv) > 1 and os.sys.argv[1] == "--test":
        manage_pod_schedule()
    else:
        run_scheduler()