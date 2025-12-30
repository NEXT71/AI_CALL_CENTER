# RunPod Pod Scheduler - Cost Optimization Guide

## 🎯 **Schedule-Based Pod Management**

Your AI service now includes **automated pod scheduling** to run only during your specified hours, saving you ~80% on costs!

### **Schedule**: Monday-Saturday, 6:45 PM PKT to 6:00 AM PST
- **Running Hours**: ~11.25 hours/day × 6 days/week = ~67.5 hours/week
- **Cost Savings**: ~80% compared to 24/7 operation

## 🚀 **Setup Instructions**

### **1. Get RunPod API Access**
1. Go to [RunPod Account Settings](https://runpod.io/console/user/settings)
2. Generate an API Key
3. Copy your Pod ID from the pod details page

### **2. Configure Environment**
Add to your `.env` file:
```env
RUNPOD_API_KEY=your_actual_api_key_here
RUNPOD_POD_ID=your_actual_pod_id_here
```

### **3. Install Scheduler Dependencies**
```bash
pip install requests python-dotenv pytz
```

### **4. Test the Scheduler**
```bash
# Test current schedule check
python runpod_scheduler.py --test
```

### **5. Run Scheduler (Choose One Method)**

#### **Option A: Local Machine (Recommended)**
```bash
# Run continuously on your local machine
python runpod_scheduler.py
```

#### **Option B: Windows Task Scheduler**
1. Create a batch file `run_scheduler.bat`:
   ```batch
   @echo off
   cd "C:\path\to\your\AI_CALL_CENTER\ai-service"
   python runpod_scheduler.py
   ```

2. Open Task Scheduler → Create Task:
   - **Name**: "RunPod AI Service Scheduler"
   - **Trigger**: At startup, repeat every 5 minutes
   - **Action**: Start program → `run_scheduler.bat`

#### **Option C: Cloud VM (Always-On)**
Deploy to a cheap cloud VM (DigitalOcean, Linode, etc. ~$5/month):
```bash
# On your VM
git clone https://github.com/YOUR_USERNAME/AI_CALL_CENTER.git
cd AI_CALL_CENTER/ai-service
pip install -r requirements.txt
python runpod_scheduler.py
```

## 📊 **How It Works**

### **Automatic Pod Management**
- **Checks every 5 minutes** if pod should be running
- **Starts pod** when schedule begins (Mon-Sat 6:45 PM PKT)
- **Stops pod** when schedule ends (Mon-Sat 6:00 AM PST)
- **Skips Sundays** entirely

### **Smart State Management**
- Only sends start/stop commands when needed
- Handles API errors gracefully
- Logs all actions for monitoring

## 💰 **Cost Analysis**

### **Before**: 24/7 Operation
- RTX A4500: $0.25/hour × 24 hours × 30 days = **$180/month**

### **After**: Scheduled Operation
- RTX A4500: $0.25/hour × 11.25 hours × 6 days/week × 4.3 weeks = **$36/month**
- **Savings**: **$144/month (80% reduction!)**

## 🔧 **Manual Override**

You can still manually start/stop the pod anytime via RunPod dashboard - the scheduler will adapt.

## 📱 **Monitoring**

Check scheduler logs to ensure it's working:
```
2025-12-31 18:45:00 - INFO - 🚀 Starting pod (scheduled time)
2025-12-31 06:00:00 - INFO - 🛑 Stopping pod (outside scheduled time)
```

## ⚠️ **Important Notes**

1. **Pod Startup Time**: Takes 1-2 minutes to start, so schedule accordingly
2. **API Rate Limits**: RunPod API has rate limits, scheduler respects them
3. **Timezone Accuracy**: Uses same timezone logic as your AI service
4. **Error Handling**: Continues running even if individual API calls fail

## 🎯 **Next Steps**

1. Get your RunPod API key and pod ID
2. Update `.env` file with credentials
3. Test with `python runpod_scheduler.py --test`
4. Set up automated execution (local machine or cloud VM)

This will save you hundreds of dollars per month while ensuring your AI service is available exactly when you need it! 💰