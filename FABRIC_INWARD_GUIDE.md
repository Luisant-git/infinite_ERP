# Fabric Inward Module - Implementation Guide

## Database Migration

Run the following commands to apply the schema changes:

```bash
cd backend
npx prisma migrate dev --name add_fabric_inward_module
npx prisma generate
```

## Backend Setup

The following modules have been created:

### 1. Master Module (`backend/src/master/`)
- Manages Fabric, Color, Dia, UOM masters
- Endpoints:
  - GET `/master/:type` - Get masters by type (Fabric, Color, Dia, UOM)
  - POST `/master` - Create new master
  - PUT `/master/:id` - Update master
  - DELETE `/master/:id` - Delete master

### 2. Fabric Inward Module (`backend/src/fabric-inward/`)
- Manages fabric inward transactions
- Endpoints:
  - GET `/fabric-inward/next-grn` - Get next GRN number
  - GET `/fabric-inward` - Get all fabric inwards (with pagination)
  - GET `/fabric-inward/:id` - Get single fabric inward
  - POST `/fabric-inward` - Create fabric inward
  - PUT `/fabric-inward/:id` - Update fabric inward
  - DELETE `/fabric-inward/:id` - Soft delete fabric inward

## Frontend Setup

### Files Created:
1. `frontend/src/api/fabricInward.js` - API service
2. `frontend/src/pages/transactions/FabricInward.jsx` - Main component

### Features Implemented:
- Auto-generated GRN number (10-digit padded)
- Header section with all required fields
- Detail grid with dynamic rows
- Process selection with rate auto-loading
- Conditional fields (Design No/Name for Print Lot)
- Auto-calculation of Total Qty and Total Rolls
- Party filtering by type (Customer, Dyeing, Compacting)
- Rate auto-loading from Party Process Rate Setting
- Sample DC Type disables rate field

## Database Schema

### Tables Created:

1. **masters** - Stores Fabric, Color, Dia, UOM
2. **fabric_inward_headers** - Main header table
3. **fabric_inward_details** - Detail rows (fabric, color, dia, etc.)
4. **fabric_inward_processes** - Process selection

## Usage Instructions

### Adding Master Data:

Before using Fabric Inward, add master data:

```javascript
// Example: Add Fabric types
POST /master
{
  "masterType": "Fabric",
  "masterName": "Cotton"
}

// Add Color
POST /master
{
  "masterType": "Color",
  "masterName": "Red"
}

// Add Dia
POST /master
{
  "masterType": "Dia",
  "masterName": "36\""
}

// Add UOM
POST /master
{
  "masterType": "UOM",
  "masterName": "KG"
}
```

### Creating Fabric Inward:

1. Click "New" button
2. System auto-generates GRN No
3. Fill header details (Party, Dates, DC Type, Fabric Type)
4. Add detail rows with fabric information
5. Select processes (rates auto-load if dyeing party selected)
6. Save

### Field Rules:

- **GRN No**: Auto-generated, locked for non-admin
- **GRN Date**: Auto system date, editable
- **Party**: Filtered to show only Customer type
- **Dyeing Party**: Filtered to show Dyeing/Compacting types
- **DC Type**: Fresh (default), Re-Process(Free), Re-Process(Charge), Sample
- **Fabric Type**: Grey Lot (default), Wet Lot, Dry Lot, Print Lot
- **Design No**: Only visible when Fabric Type = Print Lot
- **Process Rate**: Auto-loads from Party Process Rate Setting, disabled for Sample DC Type
- **Total Qty/Rolls**: Auto-calculated from detail grid

## Testing

1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to Transactions > Fabric Inward
4. Test CRUD operations

## Notes

- All deletes are soft deletes (deleteFlg = 1)
- GRN numbers are sequential and padded to 10 digits
- Process rates auto-load based on selected dyeing party
- Wet condition auto-loads from Process Master
- Production flags are checkboxes (0/1)
