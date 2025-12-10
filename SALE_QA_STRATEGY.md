# Sale-Only QA Strategy

## Overview
The AI Call Center system now **only processes and analyzes calls that resulted in a SALE**. This reduces processing volume by 80-90% and focuses QA efforts on successful sales interactions.

---

## Why Sale-Only QA?

### Business Value
1. **Learn from Success** - Analyze what works in successful sales calls
2. **Training Material** - Use successful calls for agent training
3. **Quality Patterns** - Identify patterns in winning conversations
4. **Cost Efficiency** - Process only 10-20% of total calls (sales only)

### Volume Reduction
**Realistic Volume:**
- **~150 sale calls/day maximum** (could be less)
- Average: 100-150 sale calls/day
- Monthly: 3,000-4,500 sale calls/month

**Before (Processing All Calls):**
- 1,500-2,000 total calls/day
- Cost: $150-200/month (over budget)

**After (Sales Only):**
- **150 sale calls/day maximum**
- Cost: $36-46/month ✅ (well under $100 budget)

---

## Database Schema Changes

### Call Model (`backend/src/models/Call.js`)

**New Fields:**
```javascript
{
  // Sale Status - ONLY process calls that resulted in a sale
  isSale: {
    type: Boolean,
    default: false,
    required: true,
    index: true,
  },
  saleAmount: {
    type: Number,
    min: 0,
  },
  productSold: {
    type: String,
    trim: true,
  },
  saleDate: {
    type: Date,
  },
  requiresQA: {
    type: Boolean,
    default: function() {
      return this.isSale === true; // Only QA if it's a sale
    },
    index: true,
  },
  status: {
    type: String,
    enum: ['uploaded', 'queued', 'processing', 'completed', 'failed', 'skipped'],
    // 'skipped' = non-sale calls that won't be processed
  }
}
```

**New Indexes:**
```javascript
callSchema.index({ isSale: 1, requiresQA: 1 });
callSchema.index({ isSale: 1, callDate: -1 });
```

---

## Upload Flow Changes

### Frontend Upload Form

**New Fields to Add:**
```jsx
<div className="form-group">
  <label>
    <input
      type="checkbox"
      name="isSale"
      checked={formData.isSale}
      onChange={handleSaleChange}
    />
    This call resulted in a SALE
  </label>
</div>

{formData.isSale && (
  <>
    <div className="form-group">
      <label>Sale Amount ($)</label>
      <input
        type="number"
        name="saleAmount"
        min="0"
        step="0.01"
        required
        value={formData.saleAmount}
        onChange={handleChange}
      />
    </div>
    
    <div className="form-group">
      <label>Product/Service Sold</label>
      <input
        type="text"
        name="productSold"
        value={formData.productSold}
        onChange={handleChange}
        placeholder="e.g., Premium Package, Basic Plan"
      />
    </div>
  </>
)}
```

### Backend Upload Endpoint

**Updated Logic (`backend/src/controllers/callController.js`):**
```javascript
// Extract sale fields from request
const { isSale, saleAmount, productSold } = req.body;

// Validate sale data
if (isSale === true || isSale === 'true') {
  if (!saleAmount || parseFloat(saleAmount) <= 0) {
    return res.status(400).json({
      message: 'Sale amount is required for sale calls',
    });
  }
}

// Create call with sale data
const call = await Call.create({
  // ... other fields
  isSale: isSale === true || isSale === 'true',
  saleAmount: saleAmount ? parseFloat(saleAmount) : undefined,
  productSold: productSold || undefined,
  saleDate: isSale ? new Date(callDate) : undefined,
  requiresQA: isSale === true || isSale === 'true',
  status: isSale ? 'queued' : 'skipped', // Skip non-sale calls
});

// Only process SALE calls
if (call.isSale && call.requiresQA) {
  logger.info(`Call ${callId} is a SALE - queuing for AI processing`);
  processCallAsync(call._id);
} else {
  logger.info(`Call ${callId} is NOT a sale - skipping AI processing`);
}
```

---

## Queue Processing Changes

### Worker Logic (`backend/src/workers/callProcessor.js`)

**Filter for Sale Calls Only:**
```javascript
// Only process calls that are sales
callQueue.process(async (job) => {
  const { callId } = job.data;
  const call = await Call.findById(callId);
  
  // Skip if not a sale
  if (!call.isSale || !call.requiresQA) {
    logger.info(`Skipping call ${callId} - not a sale`);
    await Call.findByIdAndUpdate(callId, { status: 'skipped' });
    return { skipped: true };
  }
  
  // Process sale call with AI
  logger.info(`Processing SALE call ${callId}, amount: $${call.saleAmount}`);
  // ... AI processing
});
```

---

## Dashboard & Reports Changes

### Sale Calls Dashboard

**New Filters:**
```javascript
// Get all sale calls
GET /api/calls?isSale=true

// Get high-value sales (>$500)
GET /api/calls?isSale=true&saleAmount[gte]=500

// Get sales by product
GET /api/calls?isSale=true&productSold=Premium Package

// Get sales by date range
GET /api/calls?isSale=true&callDate[gte]=2025-01-01&callDate[lte]=2025-01-31
```

### Sale Analytics

**New Reports:**
1. **Top Performing Agents** (by sale amount)
2. **Best Sales Calls** (highest quality + sentiment scores)
3. **Product Performance** (which products have best call quality)
4. **Sales Conversion Patterns** (common phrases in successful sales)
5. **Average Sale Quality Score** (by agent, campaign, product)

---

## CRM/Vicidial Integration (Optional)

### Auto-Detect Sales from CRM

If you use Vicidial or similar CRM:

**Sync Script:**
```javascript
// backend/src/services/crmSaleSync.js
const mysql = require('mysql2/promise');
const Call = require('../models/Call');

async function syncSalesFromCRM() {
  const connection = await mysql.createConnection({
    host: process.env.CRM_DB_HOST,
    user: process.env.CRM_DB_USER,
    password: process.env.CRM_DB_PASSWORD,
    database: process.env.CRM_DB_NAME,
  });

  // Get calls marked as SALE in CRM
  const [sales] = await connection.execute(`
    SELECT 
      vicidial_id,
      lead_id,
      user,
      campaign_id,
      call_date,
      length_in_sec,
      status,
      sale_amount,
      product_sold
    FROM vicidial_log
    WHERE status IN ('SALE', 'SOLD', 'CLOSESALE')
      AND call_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `);

  for (const sale of sales) {
    // Check if call exists in our system
    const call = await Call.findOne({ 
      callId: sale.vicidial_id 
    });

    if (call && !call.isSale) {
      // Update to mark as sale
      await Call.findByIdAndUpdate(call._id, {
        isSale: true,
        saleAmount: sale.sale_amount,
        productSold: sale.product_sold,
        saleDate: sale.call_date,
        requiresQA: true,
        status: 'queued',
      });

      logger.info(`Updated call ${sale.vicidial_id} as SALE from CRM`);
      
      // Trigger AI processing
      await queueCallProcessing(call._id, call.audioFilePath);
    }
  }

  await connection.end();
}

// Run every hour
cron.schedule('0 * * * *', syncSalesFromCRM);
```

---

## Cost Impact Analysis

### Processing Volume

**Realistic Assumptions:**
- **150 sale calls/day maximum** (actual: 100-150/day)
- AI processing: 15-25 seconds/call with GPU (average: 20 seconds)

**Processing Time:**
- 150 calls × 20 seconds = 3,000 seconds = **50 minutes/day**
- Can process all calls in under 1 hour daily

**RunPod Cost (Conservative Estimate):**
- **Option 1: Run 2 hours/day** (includes buffer time)
  - 2 hours × $0.261/hour = $0.52/day
  - $0.52 × 30 days = **$15.60/month** for GPU
  - Stopped time: 22 hours × $0.014 = $0.31/day = $9.30/month
  - **Total RunPod: $24.90/month**

- **Option 2: Run 1 hour/day** (tight schedule)
  - 1 hour × $0.261/hour = $0.26/day
  - $0.26 × 30 days = **$7.80/month** for GPU
  - Stopped time: 23 hours × $0.014 = $0.32/day = $9.60/month
  - **Total RunPod: $17.40/month**

**Total Monthly Cost (Conservative):**
```
Backend (Render):        $7
Redis (Render):          $7
RunPod GPU (2hr/day):  $25
Vercel Frontend:         $0
MongoDB Atlas:           $0
──────────────────────────
TOTAL:                 $39/month ✅
```

**Total Monthly Cost (Optimized):**
```
Backend (Render):        $7
Redis (Render):          $7
RunPod GPU (1hr/day):  $17
Vercel Frontend:         $0
MongoDB Atlas:           $0
──────────────────────────
TOTAL:                 $31/month ✅
```

---

## Migration Plan

### Step 1: Update Database Schema
```bash
# Add new fields to existing calls (set all to non-sale)
db.calls.updateMany(
  {},
  {
    $set: {
      isSale: false,
      requiresQA: false,
      status: 'skipped'
    }
  }
)

# Create indexes
db.calls.createIndex({ isSale: 1, requiresQA: 1 })
db.calls.createIndex({ isSale: 1, callDate: -1 })
```

### Step 2: Update Frontend
- Add "Sale" checkbox to upload form
- Add sale amount and product fields
- Update validation

### Step 3: Update Backend
- Modify `callController.uploadCall` to accept sale fields
- Add validation for sale amount
- Update processing logic to skip non-sales

### Step 4: Update Worker
- Filter to process only `isSale=true` calls
- Mark non-sales as `skipped`

### Step 5: Update Dashboard
- Add sale filters
- Add sale analytics
- Show sale amount in call list

---

## Benefits Summary

✅ **70-80% Cost Reduction** - Only process 150 sale calls instead of 1,500+ total calls
✅ **Under Budget** - $31-39/month (well under $100 limit)
✅ **Focus on Winners** - Analyze successful sales patterns
✅ **Better Training** - Use best sales calls for agent training
✅ **Higher ROI** - QA budget spent on revenue-generating calls
✅ **Scalable** - Can handle 2-3x growth without cost issues
✅ **Fast Processing** - All daily calls processed in under 1 hour

---

## Alternative: Process All, Filter Later

If you want to process ALL calls but prioritize sales:

```javascript
// Priority queue: Sales get processed first
const priority = call.isSale ? 1 : 5;

await callQueue.add(jobData, { priority });
```

This way:
- Sales process immediately
- Non-sales process when GPU is idle
- Can still analyze non-sales for training (why they didn't convert)

---

## Conclusion

**Recommended Strategy:** **Sale-Only QA**

Process only calls that result in sales to:
1. Stay within $31-39/month budget (well under $100 limit)
2. Focus on learning from successful interactions
3. Generate actionable insights for improving sales rates
4. Scale to 300+ calls/day without infrastructure changes

**Realistic Numbers:**
- **Processing Volume:** 150 sale calls/day maximum (100-150 average)
- **Monthly Cost:** $31-39/month (vs $150-200 for all calls)
- **Processing Time:** 50 minutes to 1 hour daily
- **Capacity Headroom:** Can handle 2-3x growth (300-450 calls/day)
- **Quality Focus:** High-value revenue-generating interactions

**GPU Utilization:**
- Current: 50-60 minutes/day (150 calls × 20-25 sec)
- Capacity: 180 calls/hour = **4,320 calls/day potential**
- Your usage: **3.5% of total capacity** (massive headroom)
