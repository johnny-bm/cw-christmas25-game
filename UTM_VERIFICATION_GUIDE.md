# UTM Parameter Verification Guide

This guide explains how to verify that UTM parameters are being tracked correctly in Google Analytics via Google Tag Manager.

## Quick Browser Test

### 1. Test with a UTM URL
Visit your game with a UTM parameter:
```
https://crackwits.com/game/Christmas25?utm_source=Instagram&utm_medium=Instagram&utm_campaign=CRWxChristmas25
```

### 2. Open Browser Console
Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows) to open Developer Tools.

### 3. Check UTM Parameters
In the console, type:
```javascript
window.checkUTM()
```

This will show:
- Current URL parameters
- Stored UTM parameters (first touch)
- Session UTM parameters (last touch)
- Tracking data that gets sent to GTM
- Current dataLayer contents

### 4. Check dataLayer Directly
You can also inspect the dataLayer directly:
```javascript
window.dataLayer
```

Look for objects containing `utm_source`, `utm_medium`, `utm_campaign`, or the `utm_parameters` event.

---

## Google Tag Manager Verification

### Step 1: Enable GTM Preview Mode

1. Go to [Google Tag Manager](https://tagmanager.google.com)
2. Select your container: **GTM-MLXV5Z9X**
3. Click **Preview** button (top right)
4. Enter your website URL: `https://crackwits.com/game/Christmas25?utm_source=Instagram&utm_medium=Instagram&utm_campaign=CRWxChristmas25`
5. Click **Connect**

### Step 2: Check dataLayer Variables

In GTM Preview mode:

1. Click on any event in the left panel (e.g., "page_view" or "utm_parameters")
2. Look at the **Variables** tab
3. You should see UTM parameters like:
   - `utm_source`
   - `utm_medium`
   - `utm_campaign`
   - `utm_source_first`
   - `utm_source_last`
   - etc.

### Step 3: Verify Tags Are Firing

1. In Preview mode, trigger a game event (start game, collect item, etc.)
2. Check the **Tags Fired** section
3. Your Google Analytics tags should fire with UTM data included

---

## Google Analytics Configuration

### Step 1: Configure GTM to Send UTM to GA4

In Google Tag Manager, you need to configure your Google Analytics 4 tags to include UTM parameters:

1. Go to **Tags** → Your GA4 Configuration Tag
2. Click **Tag Configuration**
3. Under **Fields to Set**, add:
   - Field Name: `campaign_source` → Value: `{{utm_source_last}}` or `{{utm_source}}`
   - Field Name: `campaign_medium` → Value: `{{utm_medium_last}}` or `{{utm_medium}}`
   - Field Name: `campaign_name` → Value: `{{utm_campaign_last}}` or `{{utm_campaign}}`

### Step 2: Create GTM Variables

Create Data Layer Variables in GTM for each UTM parameter:

1. Go to **Variables** → **User-Defined Variables** → **New**
2. Create variables for:
   - `utm_source` (Data Layer Variable Name: `utm_source`)
   - `utm_medium` (Data Layer Variable Name: `utm_medium`)
   - `utm_campaign` (Data Layer Variable Name: `utm_campaign`)
   - `utm_source_first` (Data Layer Variable Name: `utm_source_first`)
   - `utm_source_last` (Data Layer Variable Name: `utm_source_last`)
   - `utm_medium_first` (Data Layer Variable Name: `utm_medium_first`)
   - `utm_medium_last` (Data Layer Variable Name: `utm_medium_last`)
   - `utm_campaign_first` (Data Layer Variable Name: `utm_campaign_first`)
   - `utm_campaign_last` (Data Layer Variable Name: `utm_campaign_last`)

### Step 3: Update GA4 Event Tags

For each GA4 event tag (game_start, game_over, etc.):

1. Click on the tag
2. Under **Event Parameters**, add:
   - `utm_source`: `{{utm_source_last}}`
   - `utm_medium`: `{{utm_medium_last}}`
   - `utm_campaign`: `{{utm_campaign_last}}`
   - `utm_source_first`: `{{utm_source_first}}`
   - `utm_medium_first`: `{{utm_medium_first}}`
   - `utm_campaign_first`: `{{utm_campaign_first}}`

---

## Google Analytics Reports Verification

### Step 1: Check Real-Time Reports

1. Go to [Google Analytics](https://analytics.google.com)
2. Select your property
3. Go to **Reports** → **Realtime**
4. Visit your game with a UTM parameter
5. Check if the traffic shows up with the correct source/medium

### Step 2: Check Acquisition Reports

1. Go to **Reports** → **Acquisition** → **Traffic acquisition**
2. Look for your UTM sources (Instagram, Facebook, X, etc.)
3. Check that `utm_campaign` appears in the Campaign dimension

### Step 3: Create Custom Reports

Create a custom report to see UTM data:

1. Go to **Explore** → **Blank**
2. Add dimensions:
   - `Campaign name` (utm_campaign)
   - `Source` (utm_source)
   - `Medium` (utm_medium)
3. Add metrics:
   - `Event count`
   - `Users`
   - `Sessions`
4. Add filters for your game events

### Step 4: Check Event Parameters

1. Go to **Reports** → **Engagement** → **Events**
2. Click on an event (e.g., `game_start`)
3. Click **View event parameters in report**
4. Look for `utm_source`, `utm_medium`, `utm_campaign` parameters

---

## Testing Checklist

- [ ] Visit game with UTM parameters in URL
- [ ] Run `window.checkUTM()` in browser console - shows UTM data
- [ ] Check `window.dataLayer` - contains UTM parameters
- [ ] GTM Preview mode shows UTM variables
- [ ] GA4 tags fire with UTM data
- [ ] Real-time GA4 reports show correct source/medium
- [ ] Acquisition reports show UTM campaigns
- [ ] Event parameters include UTM data

---

## Troubleshooting

### UTM Parameters Not Showing in GA4

1. **Check dataLayer**: Run `window.dataLayer` in console - should contain UTM data
2. **Check GTM Variables**: Ensure Data Layer Variables are created correctly
3. **Check Tag Configuration**: Verify GA4 tags include UTM parameters
4. **Check Trigger**: Ensure tags fire on the right events
5. **Publish GTM**: Make sure changes are published in GTM

### UTM Parameters Not Persisting

- Check browser console for localStorage/sessionStorage errors
- Verify cookies/localStorage are enabled
- Check if user is in incognito/private mode

### First Touch vs Last Touch

- `utm_source_first`: Where user first came from (stored in localStorage)
- `utm_source_last`: Current session source (stored in sessionStorage)
- Both are sent to GTM for comprehensive attribution

---

## Example Test URLs

Test each channel:

```
Instagram: https://crackwits.com/game/Christmas25?utm_source=Instagram&utm_medium=Instagram&utm_campaign=CRWxChristmas25
Facebook: https://crackwits.com/game/Christmas25?utm_source=Facebook&utm_medium=Facebook&utm_campaign=CRWxChristmas25
X: https://crackwits.com/game/Christmas25?utm_source=X&utm_medium=X&utm_campaign=CRWxChristmas25
LinkedIn: https://crackwits.com/game/Christmas25?utm_source=LinkedIn&utm_medium=LinkedIn&utm_campaign=CRWxChristmas25
Website: https://crackwits.com/game/Christmas25?utm_source=Website&utm_medium=Website&utm_campaign=CRWxChristmas25
Email: https://crackwits.com/game/Christmas25?utm_source=Email&utm_medium=Email&utm_campaign=CRWxChristmas25
Newsletter: https://crackwits.com/game/Christmas25?utm_source=Newsletter&utm_medium=Newsletter&utm_campaign=CRWxChristmas25
WhatsApp: https://crackwits.com/game/Christmas25?utm_source=WhatsApp&utm_medium=WhatsApp&utm_campaign=CRWxChristmas25
Footer: https://crackwits.com/game/Christmas25?utm_source=Christmas25&utm_medium=Footer&utm_campaign=Christmas25
```

---

## Need Help?

If UTM parameters aren't showing up:
1. Check browser console for errors
2. Verify GTM container ID is correct: `GTM-MLXV5Z9X`
3. Ensure GTM is properly initialized (check `window.dataLayer`)
4. Verify GTM tags are configured to use UTM variables
5. Check that changes are published in GTM

