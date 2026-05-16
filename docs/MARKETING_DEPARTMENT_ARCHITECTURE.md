# SchedAssist Marketing Department - Complete Architecture

> **Blueprint for Growth, Acquisition, and Retention**

---

## 1. Organizational Structure

### 1.1 Leadership

| Role | Responsibilities | Reports To |
|------|------------------|------------|
| **Growth Director** | Strategy, budget allocation, cross-functional alignment, OKRs | CEO/Founder |
| **Product Marketing Lead** | Positioning, messaging, competitive analysis, launch strategy | Growth Director |

### 1.2 Team Structure

```
Growth Director
├── Product Marketing Lead
│   ├── Messaging & Positioning
│   ├── Competitive Intelligence
│   └── Launch Strategy
│
├── SEO/Content Manager
│   ├── Content Writer (ES/EN/IT)
│   ├── Technical SEO Specialist
│   └── Content Designer
│
├── Performance Marketing Manager
│   ├── Paid Acquisition Specialist (Google/Meta Ads)
│   ├── Conversion Rate Optimizer
│   └── Attribution Analyst
│
├── Lifecycle Marketing Manager
│   ├── Email Marketing Specialist
│   ├── Marketing Automation Engineer
│   └── Customer Success Marketer
│
├── Community & Social Lead
│   ├── Social Media Manager
│   ├── Community Manager
│   └── Influencer/Partnerships
│
├── Growth Engineer (Technical)
│   ├── Analytics/Instrumentation
│   ├── Experimentation Platform
│   └── Referral/Viral Systems
│
└── Brand & Design Lead
    ├── Visual Designer
    ├── Motion/Video Creator
    └── Design System Manager
```

### 1.3 Role Definitions (Detailed)

#### Growth Director
- Define OKRs quarterly: MQLs, CAC, LTV, Activation Rate, Churn
- Manage marketing budget (paid, tools, content production)
- Align product roadmap with growth opportunities
- Weekly growth review meetings
- Monthly board reporting

#### Product Marketing Lead
- Create positioning matrix per market (LATAM, US, EU)
- Maintain competitive battle cards (vs. Calendly, Acuity, Jane App)
- Write product launch narratives
- Create sales enablement materials
- Define ICP (Ideal Customer Profile) per segment

#### SEO/Content Manager
- Own organic traffic growth (target: 10K monthly visits in 6 months)
- Content calendar: blog posts, case studies, guides, comparison pages
- Technical SEO: site speed, structured data, hreflang (es/en/it)
- Backlink strategy: guest posts, PR, directory listings
- Keyword research per market

#### Performance Marketing Manager
- Manage Google Ads (Search, Display, Performance Max)
- Manage Meta Ads (Facebook, Instagram)
- LinkedIn Ads for B2B targeting (clinic owners, medical directors)
- A/B test landing pages
- Optimize CAC by channel

#### Lifecycle Marketing Manager
- Onboarding email sequences (trial users → activated)
- Nurture sequences (free → paid conversion)
- Retention campaigns (churn prevention)
- Reactivation campaigns (dormant users)
- Customer advocacy programs

#### Community & Social Lead
- Social media presence (LinkedIn, Twitter/X, Instagram)
- Build community (Slack/Discord for clinic owners)
- Partner with medical associations
- Webinar strategy
- User-generated content campaigns

#### Growth Engineer
- Build in-product analytics instrumentation
- Implement experimentation framework (A/B tests)
- Build referral/viral loops
- Create self-serve marketing tools inside product
- Integrate analytics stack (PostHog, Mixpanel, or custom)

#### Brand & Design Lead
- Maintain brand consistency across all touchpoints
- Create ad creatives, social graphics, video content
- Design landing pages and marketing site
- Manage design system for marketing assets

---

## 2. Marketing Features to Build in SchedAssist

### 2.1 In-Product Marketing Tools (For Tenants)

These features make SchedAssist a marketing-enabled platform, not just a scheduling tool.

#### A. Patient Marketing Suite

| Feature | Description | Priority |
|---------|-------------|----------|
| **WhatsApp Broadcast** | Send promotional messages to opted-in patients | P0 |
| **Email Campaigns** | Built-in email marketing for patient retention | P1 |
| **Referral Program** | Patients refer friends, both get discounts | P1 |
| **Review Requests** | Automated Google/Trustpilot review requests post-visit | P1 |
| **Loyalty Program** | Points system for repeat visits | P2 |
| **Waitlist Marketing** | Auto-notify waitlist when slots open | P0 (exists) |
| **No-Show Recovery** | Automated re-engagement for no-shows | P1 |

#### B. Booking Page Optimization

| Feature | Description | Priority |
|---------|-------------|----------|
| **Custom Booking Domain** | `book.clinicname.com` instead of `/book/[slug]` | P1 |
| **Booking Page SEO** | Meta tags, structured data, Open Graph per tenant | P0 |
| **Social Proof Widgets** | "X patients booked this week" on booking page | P1 |
| **Testimonials Section** | Display patient reviews on booking page | P2 |
| **Multi-language Booking** | Auto-detect browser language (es/en/it) | P0 (partial) |
| **Embeddable Widget** | `<iframe>` or JS widget for clinic websites | P1 |

#### C. Analytics & Reporting (Marketing-Focused)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Acquisition Source Tracking** | Track where bookings come from (UTM params) | P0 |
| **Conversion Funnel** | Landing → Booking → Confirmation → Visit | P1 |
| **Patient Lifetime Value** | LTV calculation per patient | P1 |
| **Churn Dashboard** | Patients who haven't booked in X days | P1 |
| **Revenue Attribution** | Revenue by acquisition channel | P2 |
| **Cohort Analysis** | Retention by signup month | P2 |

#### D. Automated Marketing Flows

| Feature | Description | Priority |
|---------|-------------|----------|
| **Welcome Series** | 3-email sequence for new patients | P1 |
| **Birthday Messages** | Automated birthday WhatsApp/email with promo | P2 |
| **Reactivation Campaigns** | "We miss you" after 30/60/90 days inactive | P1 |
| **Seasonal Promotions** | Schedule campaigns for holidays/seasons | P2 |
| **Post-Visit Follow-up** | "How was your visit?" + review request | P1 |
| **Appointment Reminders** | Already exists (WhatsApp) | P0 (done) |

### 2.2 SchedAssist Corporate Marketing (For Our SaaS)

Features on the SchedAssist marketing site (`schedassist.com`).

| Feature | Description | Priority |
|---------|-------------|----------|
| **Marketing Site** | Full landing page with features, pricing, testimonials | P0 |
| **Blog/Content Hub** | `/blog` with SEO-optimized articles | P0 |
| **Comparison Pages** | `/vs/calendly`, `/vs/acuity`, `/vs/jane-app` | P1 |
| **Case Studies** | `/case-studies` with real clinic success stories | P1 |
| **Pricing Page** | Transparent pricing with calculator | P0 |
| **Demo Request** | `/demo` form for enterprise leads | P1 |
| **Affiliate Program** | `/affiliate` with referral tracking | P2 |
| **API Documentation** | `/docs` for developers | P2 |
| **Changelog** | `/changelog` for product updates | P2 |
| **Status Page** | `status.schedassist.com` | P2 |
| **Help Center** | `/help` with searchable knowledge base | P1 |
| **ROI Calculator** | Interactive tool: "See how much you save" | P2 |

---

## 3. Agent Configuration (Sub-Agents)

### 3.1 Agent Registry

| Agent | Trigger | Capabilities | Output |
|-------|---------|--------------|--------|
| **seo-content-agent** | "Write blog post", "SEO content", "keyword research" | Keyword research, content briefs, article writing, internal linking | Markdown articles, SEO metadata |
| **email-campaign-agent** | "Create email sequence", "nurture campaign", "onboarding emails" | Email copywriting, segmentation logic, A/B test variants | Email templates, automation flows |
| **social-media-agent** | "Social post", "content calendar", "LinkedIn post" | Post creation, hashtag strategy, scheduling, engagement replies | Social posts, calendar CSV |
| **ad-copy-agent** | "Create ad", "Google Ads", "Facebook ad copy" | Ad copy variants, audience targeting, budget recommendations | Ad copy, targeting parameters |
| **analytics-agent** | "Analyze metrics", "conversion rate", "funnel analysis" | Data analysis, cohort analysis, KPI dashboards, anomaly detection | Reports, insights, recommendations |
| **referral-agent** | "Referral program", "viral loop", "invite system" | Program design, incentive structure, tracking implementation | Program spec, code snippets |
| **landing-page-agent** | "Create landing page", "LP copy", "conversion page" | Page structure, copywriting, CTA optimization, social proof placement | Page wireframe, copy, component spec |
| **competitor-agent** | "Competitor analysis", "vs [competitor]", "battle card" | Feature comparison, pricing analysis, positioning gaps, SWOT | Battle cards, comparison tables |
| **brand-agent** | "Brand guidelines", "design system", "visual identity" | Color palette, typography, component specs, usage rules | Design tokens, style guide |
| **localization-agent** | "Translate content", "localize for [market]", "hreflang" | Multi-language content adaptation, cultural nuances, SEO per locale | Localized content, hreflang tags |

### 3.2 Agent Definitions (Detailed)

#### seo-content-agent
```yaml
name: seo-content-agent
description: SEO content creation and optimization specialist
capabilities:
  - keyword_research: "Find high-intent keywords for clinic scheduling"
  - content_brief: "Generate structured briefs with target keywords, word count, H2/H3 structure"
  - article_writing: "Write SEO-optimized blog posts in es/en/it"
  - internal_linking: "Suggest internal links to product pages and other articles"
  - meta_optimization: "Generate title tags, meta descriptions, OG tags"
  - content_audit: "Identify content gaps and optimization opportunities"
triggers:
  - "write a blog post about [topic]"
  - "research keywords for [market]"
  - "create content calendar"
  - "optimize this page for SEO"
output_format: markdown + yaml_frontmatter
```

#### email-campaign-agent
```yaml
name: email-campaign-agent
description: Email marketing and lifecycle automation specialist
capabilities:
  - sequence_design: "Design multi-email sequences with trigger logic"
  - copywriting: "Write email subject lines, body copy, CTAs"
  - segmentation: "Define audience segments for targeting"
  - ab_testing: "Create A/B test variants for subject lines and content"
  - deliverability: "Optimize for inbox placement (SPF, DKIM, DMARC guidance)"
  - analytics: "Track open rates, click rates, conversion rates"
triggers:
  - "create onboarding email sequence"
  - "write nurture campaign for trial users"
  - "design reactivation emails"
  - "A/B test subject lines"
output_format: json_sequence + html_templates
```

#### social-media-agent
```yaml
name: social-media-agent
description: Social media strategy and content creation specialist
capabilities:
  - post_creation: "Write platform-specific posts (LinkedIn, Twitter, Instagram)"
  - content_calendar: "Generate weekly/monthly content calendars"
  - hashtag_strategy: "Research and recommend hashtags per market"
  - engagement: "Draft replies to comments and mentions"
  - trending_topics: "Identify trending topics in healthcare/SaaS"
  - visual_briefs: "Create design briefs for graphics and videos"
triggers:
  - "create social media calendar"
  - "write LinkedIn post about [topic]"
  - "respond to this comment"
  - "find trending hashtags"
output_format: csv_calendar + post_drafts
```

#### ad-copy-agent
```yaml
name: ad-copy-agent
description: Paid advertising copy and strategy specialist
capabilities:
  - google_ads: "Write search ads (headlines, descriptions, extensions)"
  - meta_ads: "Write Facebook/Instagram ad copy with visual briefs"
  - linkedin_ads: "Write B2B ad copy for clinic decision-makers"
  - audience_targeting: "Define audience segments and lookalike audiences"
  - budget_allocation: "Recommend budget split by channel"
  - landing_page_match: "Ensure ad-to-landing-page message match"
triggers:
  - "create Google Ads campaign"
  - "write Facebook ad copy"
  - "design LinkedIn ad strategy"
  - "optimize ad performance"
output_format: ad_variants_json + targeting_spec
```

#### analytics-agent
```yaml
name: analytics-agent
description: Marketing analytics and growth insights specialist
capabilities:
  - funnel_analysis: "Analyze conversion funnels and drop-off points"
  - cohort_analysis: "Retention analysis by signup cohort"
  - attribution: "Multi-touch attribution modeling"
  - kpi_tracking: "Monitor CAC, LTV, MRR, churn, activation rate"
  - anomaly_detection: "Identify unusual patterns in metrics"
  - reporting: "Generate weekly/monthly performance reports"
triggers:
  - "analyze conversion funnel"
  - "why did signups drop last week?"
  - "calculate CAC by channel"
  - "generate monthly report"
output_format: dashboard_spec + insights_report
```

#### referral-agent
```yaml
name: referral-agent
description: Referral and viral growth program specialist
capabilities:
  - program_design: "Design referral programs with incentive structures"
  - viral_loops: "Identify and design viral loops in product"
  - tracking: "Implement referral tracking and attribution"
  - fraud_prevention: "Design rules to prevent referral abuse"
  - optimization: "A/B test referral incentives and messaging"
  - integration: "Connect referral system with Stripe for rewards"
triggers:
  - "design referral program"
  - "create viral loop for booking page"
  - "implement referral tracking"
  - "optimize referral conversion"
output_format: program_spec + implementation_guide
```

#### landing-page-agent
```yaml
name: landing-page-agent
description: Landing page design and conversion optimization specialist
capabilities:
  - page_structure: "Design high-converting landing page layouts"
  - copywriting: "Write headlines, subheads, body copy, CTAs"
  - social_proof: "Recommend testimonial placement and trust signals"
  - form_optimization: "Optimize form fields for conversion"
  - ab_testing: "Design A/B test hypotheses and variants"
  - component_spec: "Generate React component specifications"
triggers:
  - "create landing page for [use case]"
  - "optimize this landing page"
  - "write copy for pricing page"
  - "design A/B test for CTA"
output_format: wireframe_spec + copy_document + component_tree
```

#### competitor-agent
```yaml
name: competitor-agent
description: Competitive intelligence and positioning specialist
capabilities:
  - feature_comparison: "Compare features vs. competitors"
  - pricing_analysis: "Analyze competitor pricing models"
  - positioning_gaps: "Identify whitespace in market positioning"
  - swot_analysis: "Generate SWOT for SchedAssist vs. competitors"
  - battle_cards: "Create sales battle cards for each competitor"
  - messaging: "Develop differentiation messaging"
triggers:
  - "analyze competitor [name]"
  - "create battle card vs [competitor]"
  - "what's our differentiation?"
  - "pricing comparison"
output_format: comparison_table + battle_card + positioning_doc
```

#### brand-agent
```yaml
name: brand-agent
description: Brand identity and design system specialist
capabilities:
  - brand_guidelines: "Maintain and enforce brand guidelines"
  - design_tokens: "Manage color palette, typography, spacing tokens"
  - component_specs: "Define component design specifications"
  - visual_identity: "Create logos, icons, illustrations"
  - motion_design: "Define animation and transition guidelines"
  - asset_generation: "Generate brand assets in multiple formats"
triggers:
  - "create brand guideline"
  - "design new component"
  - "update color palette"
  - "create marketing asset"
output_format: design_tokens_json + style_guide + asset_files
```

#### localization-agent
```yaml
name: localization-agent
description: Multi-language content and market localization specialist
capabilities:
  - translation: "Translate content maintaining tone and context"
  - cultural_adaptation: "Adapt messaging for cultural nuances"
  - seo_localization: "Localize SEO strategy per market"
  - hreflang: "Implement hreflang tags for multi-language sites"
  - market_research: "Research local competitors and preferences"
  - compliance: "Ensure compliance with local regulations (GDPR, etc.)"
triggers:
  - "translate this content to [language]"
  - "localize for [market]"
  - "implement hreflang tags"
  - "research [market] competitors"
output_format: localized_content + hreflang_config + market_report
```

### 3.3 Agent Activation Matrix

```
User Request                          → Agent to Activate
─────────────────────────────────────────────────────────────
"Write blog post about X"            → seo-content-agent
"Create email sequence"              → email-campaign-agent
"Social media calendar"              → social-media-agent
"Google Ads campaign"                → ad-copy-agent
"Analyze conversion funnel"          → analytics-agent
"Design referral program"            → referral-agent
"Create landing page"                → landing-page-agent
"Competitor analysis"                → competitor-agent
"Brand guidelines"                   → brand-agent
"Translate to Spanish"               → localization-agent
"SEO optimization"                   → seo-content-agent
"A/B test design"                    → landing-page-agent + analytics-agent
"Content strategy"                   → seo-content-agent + social-media-agent
"Growth strategy"                    → analytics-agent + referral-agent
"Launch campaign"                    → ad-copy-agent + email-campaign-agent + social-media-agent
```

---

## 4. Implementation Plan

### Phase 1: Foundation (Weeks 1-4) - Quick Wins

**Goal:** Establish baseline marketing infrastructure and start generating leads.

| Week | Task | Owner | Deliverable |
|------|------|-------|-------------|
| 1 | Marketing site MVP (landing, pricing, features) | Growth Director + Brand | Live landing page |
| 1 | Analytics instrumentation (PostHog/Mixpanel) | Growth Engineer | Tracking dashboard |
| 1 | UTM parameter tracking in booking flow | Growth Engineer | Source attribution |
| 2 | Blog setup with 3 seed articles | SEO/Content | `/blog` live with content |
| 2 | Email infrastructure (Resend/SendGrid) | Lifecycle | Transactional + marketing emails |
| 2 | Onboarding email sequence (3 emails) | Lifecycle | Automated welcome flow |
| 3 | Social media accounts (LinkedIn, Twitter) | Community | Profiles live, 5 posts scheduled |
| 3 | Google Search Console + Analytics | SEO/Content | Search data tracking |
| 3 | Basic SEO (meta tags, sitemap, robots.txt) | SEO/Content | Technical SEO baseline |
| 4 | Comparison page: `/vs/calendly` | SEO/Content | SEO landing page |
| 4 | Help center / FAQ | Lifecycle | `/help` with 10 articles |
| 4 | Activate `seo-content-agent` + `email-campaign-agent` | Growth Director | Agents operational |

**KPIs - Phase 1:**
- Marketing site live: ✅
- Analytics tracking: ✅
- 3 blog posts published
- Onboarding email sequence live
- Social profiles created
- First 10 organic visits from blog

---

### Phase 2: Growth Engine (Weeks 5-12)

**Goal:** Build acquisition channels and optimize conversion.

| Week | Task | Owner | Deliverable |
|------|------|-------|-------------|
| 5 | Google Ads campaign (Search - branded + competitor) | Performance | Live campaigns, $500/mo budget |
| 5 | Landing page A/B test framework | Growth Engineer | Experimentation platform |
| 6 | Meta Ads (Facebook/Instagram - retargeting) | Performance | Retargeting campaigns live |
| 6 | Referral program design + implementation | Growth Engineer | Referral system live |
| 7 | Nurture sequence (trial → paid conversion) | Lifecycle | 5-email nurture flow |
| 7 | Case study #1 (first happy customer) | SEO/Content | Published case study |
| 8 | Embeddable booking widget | Growth Engineer | JS widget for clinics |
| 8 | LinkedIn Ads (B2B targeting) | Performance | LinkedIn campaigns live |
| 9 | Review request automation | Lifecycle | Post-visit review requests |
| 9 | Content calendar (30 days) | SEO/Content + Social | Scheduled content |
| 10 | Custom booking domains | Growth Engineer | `book.clinicname.com` |
| 10 | Patient broadcast (WhatsApp) | Lifecycle | In-product broadcast tool |
| 11 | Reactivation campaigns (30/60/90 day) | Lifecycle | Automated reactivation |
| 11 | SEO optimization (internal linking, schema) | SEO/Content | Technical SEO improvements |
| 12 | Activation funnel analysis + optimization | Analytics | Funnel report + improvements |

**KPIs - Phase 2:**
- 50 MQLs/month
- CAC < $100
- Trial → Paid conversion: 15%+
- Organic traffic: 1K monthly visits
- Email open rate: 35%+
- Referral program: 10% of new signups

---

### Phase 3: Scale & Optimize (Weeks 13-24)

**Goal:** Scale successful channels, build brand, expand markets.

| Week | Task | Owner | Deliverable |
|------|------|-------|-------------|
| 13-14 | Content hub expansion (10+ articles) | SEO/Content | Content library |
| 13-14 | Localized content (EN, IT markets) | Localization | Multi-language blog |
| 15-16 | Affiliate program launch | Growth Director | `/affiliate` live |
| 15-16 | ROI Calculator tool | Growth Engineer | Interactive calculator |
| 17-18 | Webinar strategy (monthly) | Community | First webinar |
| 17-18 | Partnership outreach (medical associations) | Community | 3 partnerships |
| 19-20 | Loyalty program for patients | Growth Engineer | Points system |
| 19-20 | Video content strategy | Brand | 5 explainer videos |
| 21-22 | Advanced attribution modeling | Analytics | Multi-touch attribution |
| 21-22 | Cohort analysis dashboard | Analytics | Retention dashboard |
| 23-24 | API documentation + developer marketing | Growth Engineer | `/docs` live |
| 23-24 | Changelog + product updates marketing | Brand | `/changelog` live |

**KPIs - Phase 3:**
- 200 MQLs/month
- CAC < $75
- Trial → Paid conversion: 20%+
- Organic traffic: 5K monthly visits
- Churn rate: < 5% monthly
- NPS: 50+
- Affiliate referrals: 15% of new signups

---

### Phase 4: Market Leadership (Months 6-12)

**Goal:** Establish SchedAssist as category leader.

| Initiative | Owner | Deliverable |
|------------|-------|-------------|
| Thought leadership (original research, reports) | SEO/Content + Growth Director | Industry report |
| Community platform (Slack/Discord) | Community | Active community |
| Certification program | Lifecycle | "SchedAssist Certified" program |
| Enterprise sales enablement | Product Marketing | Sales deck, demo environment |
| International expansion (full localization) | Localization | 5+ languages |
| PR strategy | Growth Director | Media mentions, press releases |
| Customer advisory board | Growth Director | 10-member CAB |
| Annual conference/virtual summit | Community + Brand | Event with 500+ attendees |

**KPIs - Phase 4:**
- 1,000+ MQLs/month
- CAC < $50
- Trial → Paid conversion: 25%+
- Organic traffic: 20K+ monthly visits
- Churn rate: < 3% monthly
- NPS: 70+
- Brand awareness: 30% in target market
- Revenue: $100K MRR

---

## 5. KPIs by Area

### 5.1 SEO/Content Marketing

| KPI | Target (3mo) | Target (6mo) | Target (12mo) |
|-----|--------------|--------------|---------------|
| Organic traffic | 1K visits/mo | 5K visits/mo | 20K visits/mo |
| Ranking keywords (top 10) | 20 | 100 | 500 |
| Blog articles published | 10 | 30 | 100 |
| Backlinks (referring domains) | 20 | 100 | 500 |
| Domain Authority | 15 | 25 | 40 |
| Organic MQLs | 10/mo | 50/mo | 200/mo |

### 5.2 Email Marketing & Lifecycle

| KPI | Target (3mo) | Target (6mo) | Target (12mo) |
|-----|--------------|--------------|---------------|
| Email list size | 500 | 2,000 | 10,000 |
| Open rate | 35% | 40% | 45% |
| Click-through rate | 5% | 8% | 12% |
| Trial → Paid conversion | 15% | 20% | 25% |
| Churn rate (email-assisted) | 8% | 5% | 3% |
| Reactivation rate | 10% | 15% | 20% |

### 5.3 Social Media & Community

| KPI | Target (3mo) | Target (6mo) | Target (12mo) |
|-----|--------------|--------------|---------------|
| LinkedIn followers | 500 | 2,000 | 10,000 |
| Twitter/X followers | 200 | 1,000 | 5,000 |
| Engagement rate | 3% | 5% | 8% |
| Community members | 50 | 500 | 2,000 |
| Social-sourced MQLs | 5/mo | 20/mo | 100/mo |
| Webinar attendees | 30/event | 100/event | 300/event |

### 5.4 Paid Acquisition

| KPI | Target (3mo) | Target (6mo) | Target (12mo) |
|-----|--------------|--------------|---------------|
| Monthly ad spend | $500 | $2,000 | $10,000 |
| CAC (blended) | $100 | $75 | $50 |
| CAC payback period | 3 months | 2 months | 1.5 months |
| ROAS | 2x | 3x | 5x |
| Conversion rate (LP) | 5% | 8% | 12% |
| Paid MQLs | 20/mo | 80/mo | 400/mo |

### 5.5 Analytics & Growth

| KPI | Target (3mo) | Target (6mo) | Target (12mo) |
|-----|--------------|--------------|---------------|
| Activation rate | 40% | 55% | 70% |
| Time to first booking | < 24h | < 12h | < 6h |
| Experiment velocity | 2/month | 4/month | 8/month |
| Experiment win rate | 25% | 35% | 40% |
| Referral rate | 5% | 10% | 20% |
| Viral coefficient | 0.1 | 0.3 | 0.5 |

### 5.6 Referral/Viral Programs

| KPI | Target (3mo) | Target (6mo) | Target (12mo) |
|-----|--------------|--------------|---------------|
| Referral program participation | 10% | 25% | 40% |
| Referrals per participant | 1.5 | 2.5 | 4 |
| Referral conversion rate | 20% | 30% | 40% |
| % of signups from referrals | 5% | 15% | 30% |
| Viral coefficient | 0.1 | 0.3 | 0.5 |
| Cost per referral | $20 | $15 | $10 |

### 5.7 Brand & Design

| KPI | Target (3mo) | Target (6mo) | Target (12mo) |
|-----|--------------|--------------|---------------|
| Brand awareness (survey) | 5% | 15% | 30% |
| Brand consistency score | 80% | 90% | 95% |
| Design system adoption | 60% | 85% | 100% |
| Creative asset production | 20/mo | 40/mo | 80/mo |
| Video views | 500 | 5,000 | 50,000 |
| Press mentions | 2 | 10 | 50 |

---

## 6. Tech Stack Recommendations

### 6.1 Marketing Infrastructure

| Category | Tool | Cost | Purpose |
|----------|------|------|---------|
| **Analytics** | PostHog (self-hosted) | Free tier | Product analytics, funnels, session recording |
| **Email** | Resend | $20/mo | Transactional + marketing emails |
| **CRM** | HubSpot (free) | Free | Lead management, pipeline |
| **Ads** | Google Ads, Meta Ads | Variable | Paid acquisition |
| **SEO** | Ahrefs or SEMrush | $99/mo | Keyword research, backlink tracking |
| **Social** | Buffer or Hootsuite | $15/mo | Social scheduling |
| **Landing Pages** | Custom (Next.js) | $0 | Built into marketing site |
| **A/B Testing** | PostHog Experiments | Included | Experimentation platform |
| **Heatmaps** | PostHog Recordings | Included | User behavior analysis |
| **Referral** | Custom build | Dev time | In-product referral system |
| **Chat** | Crisp or Intercom | $25/mo | Live chat on marketing site |
| **Reviews** | Trustpilot or G2 | Free tier | Review collection |

### 6.2 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SchedAssist Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Booking Flow │  │ Dashboard    │  │ Patient Portal   │  │
│  │ (UTM capture)│  │ (Analytics)  │  │ (Referrals)      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           ▼                                  │
│                  ┌─────────────────┐                         │
│                  │  Event Pipeline  │                         │
│                  │  (PostHog SDK)   │                         │
│                  └────────┬────────┘                         │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  PostHog    │  │  Resend     │  │  HubSpot    │         │
│  │  Analytics  │  │  Emails     │  │  CRM        │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Budget Allocation (First 6 Months)

| Category | Monthly | 6-Month Total | % of Budget |
|----------|---------|---------------|-------------|
| **Paid Ads** | $2,000 | $12,000 | 40% |
| **Tools & Software** | $300 | $1,800 | 6% |
| **Content Production** | $1,000 | $6,000 | 20% |
| **Design & Creative** | $800 | $4,800 | 16% |
| **Events & Webinars** | $400 | $2,400 | 8% |
| **Contingency** | $500 | $3,000 | 10% |
| **Total** | **$5,000** | **$30,000** | **100%** |

---

## 8. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low organic traffic growth | High | Diversify with paid + referral channels |
| High CAC in paid ads | High | Optimize landing pages, improve targeting |
| Email deliverability issues | Medium | Warm up domains, maintain list hygiene |
| Competitor response | Medium | Differentiate on WhatsApp + multi-tenant |
| Churn higher than expected | High | Improve onboarding, add lifecycle campaigns |
| Regulatory compliance (GDPR) | High | Legal review, consent management |

---

## 9. Success Metrics Summary

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| **MQLs/month** | 50 | 200 | 1,000 |
| **CAC** | $100 | $75 | $50 |
| **Trial → Paid** | 15% | 20% | 25% |
| **Organic Traffic** | 1K | 5K | 20K |
| **Email List** | 500 | 2,000 | 10,000 |
| **Churn Rate** | 8% | 5% | 3% |
| **NPS** | 30 | 50 | 70 |
| **MRR** | $10K | $50K | $100K |

---

## 10. Next Steps (Immediate Actions)

1. **Week 1:** Set up PostHog analytics + UTM tracking in booking flow
2. **Week 1:** Deploy marketing site MVP (landing, pricing, features)
3. **Week 2:** Configure Resend for email infrastructure
4. **Week 2:** Write and publish 3 seed blog articles
5. **Week 2:** Create onboarding email sequence (3 emails)
6. **Week 3:** Set up social media profiles + schedule first 5 posts
7. **Week 3:** Submit sitemap to Google Search Console
8. **Week 4:** Activate `seo-content-agent` and `email-campaign-agent`
9. **Week 4:** Publish `/vs/calendly` comparison page
10. **Week 4:** Launch `/help` center with 10 FAQ articles

---

*Document Version: 1.0*
*Last Updated: 2026-05-15*
*Owner: Growth Director*
*Status: Ready for Implementation*
