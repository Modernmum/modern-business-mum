# MFS Delivery System - Connected to Unbound

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNBOUND-TEAM (Lead Gen)                      │
│              https://web-production-486cb.up.railway.app        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Gap Finder   │  │ Auto         │  │ RSS/Forum    │          │
│  │ Agent        │  │ Outreach     │  │ Scanner      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                     │
│              ┌────────────────────────┐                         │
│              │  scored_opportunities  │                         │
│              │  outreach_campaigns    │                         │
│              └────────────┬───────────┘                         │
│                           │                                     │
│                    When status='replied'                        │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼ WEBHOOK / API CALL
┌───────────────────────────────────────────────────────────────────┐
│                  MFS-DELIVERY-SYSTEM (This Repo)                  │
│                   Client Fulfillment Engine                       │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Client Onboarding│  │ Custom Template  │  │ AI Support     │  │
│  │ Agent            │  │ Service          │  │ Chat           │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Rapid MVP        │  │ SEO Content      │  │ Email          │  │
│  │ Builder          │  │ Generator        │  │ Marketer       │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                   │
│  + 25 more specialized delivery agents                           │
└───────────────────────────────────────────────────────────────────┘
```

## Integration Point

Unbound-Team sends new clients to MFS-Delivery-System via:

```javascript
// In Unbound auto-outreach-agent.js when status becomes 'replied':
await fetch('https://mfs-delivery.railway.app/api/new-client', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company_name: campaign.company_name,
    contact_email: campaign.recipient_email,
    pain_points: campaign.lead_research,
    source: 'unbound-outreach'
  })
});
```

## Systems Overview

### UNBOUND-TEAM (Parent - Lead Generation)
- **Purpose**: Find and acquire new clients for MFS
- **Location**: /Users/kwray/Unbound-Team
- **GitHub**: github.com/Modernmum/Unbound-Team
- **Deployed**: Railway (web-production-486cb.up.railway.app)
- **Agents**: Gap Finder, Auto Outreach, RSS Scanner

### MFS-DELIVERY-SYSTEM (Child - Client Fulfillment)
- **Purpose**: Deliver solutions to acquired clients
- **Location**: /Users/kwray/MFS-Delivery-System
- **GitHub**: github.com/Modernmum/modern-business-mum (to be renamed)
- **Deployed**: Vercel (maggieforbesstrategies.com)
- **Agents**: 31 specialized delivery agents

## Data Flow

1. **Discovery** (Unbound): Find businesses with problems
2. **Qualification** (Unbound): Score and prioritize leads
3. **Outreach** (Unbound): Send personalized emails via Resend
4. **Conversion** (Unbound): Track replies and interested leads
5. **Handoff** → **Onboarding** (MFS-Delivery): Receive new client
6. **Delivery** (MFS-Delivery): Execute appropriate agent based on need
7. **Support** (MFS-Delivery): AI chat handles ongoing support

## Key Files

### Unbound-Team
- `backend/agents/auto-outreach-agent.js` - Sends outreach, triggers handoff
- `backend/services/ai-researcher.js` - Researches leads with Perplexity
- `backend/services/email-finder.js` - Finds contact emails

### MFS-Delivery-System
- `agents/mbm-client-onboarding.js` - Receives new clients from Unbound
- `agents/custom-template-service.js` - Builds custom solutions
- `agents/rapid-mvp-builder.js` - Creates MVPs for clients
- `delivery-server.js` - Main delivery API server
