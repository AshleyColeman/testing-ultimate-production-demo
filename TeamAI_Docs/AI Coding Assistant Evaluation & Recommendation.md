# AI Coding Assistant Evaluation & Recommendation

**Date:** 17 November 2025  
**Prepared by:** Ashley Coleman

---

## Executive Summary

### Purpose

This report evaluates leading AI coding assistants to recommend a standard tool for our engineering team. The evaluation focuses on capability, team fit, cost-effectiveness, and strategic alignment with our development needs.

### Recommendation

**We recommend adopting Cursor (Teams plan) as our standard AI coding assistant.**

### Key Decision Factors

**Best-in-class capabilities:**

- Superior codebase understanding across entire repositories
- Advanced multi-file editing and refactoring
- Powerful agent workflows for complex tasks
- Seamless IDE experience (VS Code-based)

**Strong ROI:**

- Total annual cost (with annual discount): **R28,416** for 4 developers
- Annual savings vs monthly billing: **R7,104** (20% discount)
- Estimated productivity improvement: 5-10%
- ROI: ~R150k+ in saved time vs R28k investment

**Strategic positioning:**

- Multi-model support (not locked into single provider)
- Built for current needs and future AI development trends
- Active development with regular feature updates

---

## 1. Cost Analysis

### Cursor Pricing - Annual Discount

**Monthly pricing:** $40/user/month  
**Annual pricing:** $32/user/month (20% discount when paid yearly)

For our 4-developer team:

- **Monthly billing:** $40 × 4 × 12 = $1,920/year = **R35,520/year**
- **Annual billing:** $32 × 4 × 12 = $1,536/year = **R28,416/year**
- **Annual savings:** R7,104 (20% discount)

### Annual Cost Comparison (4 Developers, Yearly Billing)

| Tool                      | Cost per User/Year | Team of 4/Year | Notes                      |
| ------------------------- | -----------------: | -------------: | -------------------------- |
| **Cursor (Teams)**        |         **R7,104** |    **R28,416** | **20% discount on annual** |
| GitHub Copilot (Business) |             R4,218 |        R16,872 | Lowest cost option         |
| Claude Pro                |             R4,440 |        R17,760 | Individual seats only      |

_Exchange rate: 1 USD ≈ 18.5 ZAR_

**Note:** All Rand values are based on an assumed FX rate of 1 USD ≈ 18.5 ZAR. Actual costs may vary slightly depending on billing date and exchange rate fluctuations.

**Key insight:** While Cursor has a higher upfront cost, it delivers significantly more capability than cheaper alternatives.

### Cost Context

With annual billing, Cursor delivers strong value:

- Single mid-level developer salary: R600k-R1m annually
- Cursor cost per developer: R7,104 annually (less than 1% of developer cost)
- If Cursor improves team productivity by just **2%**, the return exceeds the entire tool cost

## 2. Why Teams Plan vs Individual Licenses

### The Critical Difference

Cursor offers two pricing tiers:

- **Individual Pro:** $20/user/month (R17,760 ZAR annually for 4 developers, assuming similar monthly billing)
- **Teams:** $40/user/month or $32/month annually (R28,416 ZAR annually for 4 developers with annual billing)

**The cost difference is R10,656/year for our 4-person team.**

However, **individual licenses are not suitable for company use** due to critical missing features around security, governance, and collaboration.

### What You Lose with Individual Licenses

#### 🔒 **1. No Enforced Privacy Mode (Major Security Risk)**

- Individual accounts **cannot enforce Privacy Mode** at the organization level
- Developers may accidentally send proprietary code to the cloud for AI training
- **No guaranteed "your code never trains the model" compliance**
- For any company with sensitive code, this is the biggest risk
- **This alone justifies the Teams upgrade**

#### 👥 **2. No Admin Controls or Governance**

Individual licenses lack:

- ❌ Central billing and budget controls
- ❌ Centralized usage limits
- ❌ Seat management and provisioning
- ❌ SSO / SAML identity control
- ❌ Usage analytics and monitoring
- ❌ Ability to instantly remove access when developers leave

**Result:** Each developer becomes an isolated account with no oversight—a major governance and security problem.

#### 📋 **3. No Team-Level Security & Compliance**

Missing critical features:

- No audit trails or logging
- No guaranteed privacy enforcement
- No team-level policy control
- Much harder to pass security audits or meet compliance requirements
- Cannot demonstrate to clients/partners that code is protected

#### 🤝 **4. No Team Collaboration Features**

Teams plan provides:

- ✅ Shared rulesets and coding standards
- ✅ Shared agent configurations
- ✅ Shared codebase memory and indexing
- ✅ Consistent workflows across the team

Individual accounts mean:

- ❌ Everyone's AI behaves differently
- ❌ Inconsistent quality of results
- ❌ No shared knowledge base
- ❌ Each developer reinvents solutions

#### 🚀 **5. Difficult Onboarding**

- New developers get no shared project-level memory
- No centralized workspace setup
- Each developer must configure everything manually from scratch
- Senior developers spend more time helping juniors "set up their Cursor"
- Slower ramp-up time for new hires

#### ⚠️ **6. Shadow AI Risk**

With personal accounts:

- Each developer might use different settings and external models
- **Data leakage risk increases dramatically**
- IT cannot track what AI services are being used
- Code can be sent to various AI providers without oversight
- This is exactly what most companies want to avoid

### The Only Benefit of Individual Licenses

**Lower upfront cost:** Saves R10,656/year for our 4-person team.

### Risk vs Savings Analysis

**Potential cost of a single code leak or compliance failure:** R500k - R5m+

- Legal fees
- Client trust damage
- Regulatory fines
- Remediation costs

**Annual savings with individual licenses:** R10,656

**The math is clear:** Saving R10,656/year is not worth the security, governance, and collaboration risks.

### Recommendation

**For any company, even small teams, the Teams plan is the only appropriate option.**

The R2,664 per developer per year premium ($12/month difference × 12 months × 18.5 ZAR) buys:

- ✅ Guaranteed code privacy and security
- ✅ Centralized control and governance
- ✅ Team collaboration and consistency
- ✅ Compliance and audit capabilities
- ✅ Professional admin and security features

Individual licenses might work for:

- Solo freelancers with no client confidentiality requirements
- Personal hobby projects
- Students or learners

**They are not suitable for company use under any circumstances.**

---

## 3. What Cursor Teams Includes

### Core Features

**1. Advanced AI Models**

- Each team seat ($40/month) includes $20/month of usage credits
- Access to Claude 3.5 Sonnet, GPT-4, and other frontier models
- Variable request pricing based on task complexity - simple questions cost less than full PR implementations

**2. Codebase Intelligence**

- Full repository indexing and semantic understanding
- AI that learns your team's coding patterns and conventions
- Context-aware suggestions across the entire project

**3. Agent Workflows (Composer)**

- Multi-step task automation
- Can implement features, write tests, and refactor across multiple files
- Terminal command execution and testing

**4. Team Collaboration Features**

- SAML/OIDC Single Sign-On (SSO) for centralized authentication
- Enforced privacy mode ensuring no code is stored or trained on by third parties
- Admin dashboards with real-time usage statistics and spending controls
- Centralized billing and user management

**5. Security & Compliance**

- Organization-wide privacy controls that admins can enforce
- Monthly team-level and per-user spending limits to prevent unexpected charges
- Usage analytics and audit capabilities

### Usage Model

- Base subscription: $40/user/month with $20 included usage per user
- Beyond included usage, automatic on-demand billing at API prices plus Cursor token fee
- Predictable costs with spending caps available

---

## 4. Competitive Analysis

### Capability Comparison Matrix

| Capability               | Cursor     | Copilot    | Claude Code |
| ------------------------ | ---------- | ---------- | ----------- |
| **Repo Understanding**   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐⭐    |
| **Multi-file Refactors** | ⭐⭐⭐⭐⭐ | ⭐⭐       | ⭐⭐⭐⭐    |
| **Agent Workflows**      | ⭐⭐⭐⭐⭐ | ⭐⭐       | ⭐⭐⭐⭐⭐  |
| **IDE Experience**       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐        |
| **Team Features**        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐        |
| **Value for Money**      | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐      |

### Why Cursor Leads

**1. Cursor vs GitHub Copilot**

- Copilot: Better GitHub integration, very stable, lower cost (R16,872 vs R28,416)
- Cursor: Superior codebase understanding, better multi-file operations, more advanced agent capabilities
- **Decision:** Cursor's advanced features justify the extra R11.5k/year for our use case

**2. Cursor vs Claude Code**

- Claude Code: Excellent reasoning, powerful for complex tasks
- Cursor: Better everyday workflow, IDE integration, easier team adoption
- **Decision:** Keep Claude Code as optional specialist tool; Cursor for primary workflow

---

## 5. Business Case for Cursor

### Quantified Benefits

**Developer Productivity**

- Faster feature implementation: 10-20% time savings on routine coding
- Reduced context switching: AI handles boilerplate and repetitive tasks
- Better code quality: Consistent with team patterns and standards

**Onboarding Acceleration**

- New developers can query the AI about codebase architecture
- Self-service answers to "Where is X implemented?"
- Reduced burden on senior developers for basic questions
- Estimated: 2-3 weeks faster to full productivity

**Technical Debt Reduction**

- Multi-file refactoring makes large improvements feasible
- Easier to maintain consistency across codebase
- Test generation and documentation assistance

### ROI Calculation

**Annual cost for 4 developers (with annual discount):** R28,416

**Conservative productivity improvement:** 5%

- 4 developers × R750k average fully-loaded cost = R3m total
- 5% improvement = R150k value annually
- **Net benefit: R122k**

**Realistic productivity improvement:** 10%

- 10% of R3m = R300k value
- **Net benefit: R272k**

**Estimated ROI: 3–10x** based on realistic productivity improvements. Even a modest 2% improvement (R60k) delivers over 2x return on investment.

---

## 6. Risk Mitigation

### Identified Risks

**1. Budget Overruns**

- _Risk:_ Variable pricing could exceed budget
- _Mitigation:_ Set monthly team-level spending limits and per-user controls to prevent unexpected charges

**2. Low Adoption**

- _Risk:_ Team doesn't use tool effectively
- _Mitigation:_ Proper onboarding, champion model, show quick wins

**3. Code Quality Concerns**

- _Risk:_ Over-reliance on AI suggestions leading to lower code quality
- _Mitigation:_ Cursor is positioned as an assistant, not an autopilot. Developers remain accountable for design and code quality. We will maintain existing code review processes and testing standards—all AI-generated code goes through the same review as human-written code.

**4. Vendor Lock-in**

- _Risk:_ Dependency on single tool
- _Mitigation:_ Cursor supports multiple AI models (Claude, GPT-4, etc.). We can switch backends or tools if needed without losing our workflows.

---

## 7. Alternative Scenarios

### If Budget is Primary Constraint

**Recommendation:** GitHub Copilot Business (R16,872/year)

- Significantly lower cost (R11.5k less than Cursor)
- Adequate features for basic AI assistance
- Strong GitHub integration
- Note: Will lack advanced multi-file refactoring and deep codebase understanding

### If We Need More Advanced Security

**Recommendation:** Cursor Enterprise (custom pricing)

- Adds SCIM provisioning, priority support
- Dedicated account manager
- Advanced compliance features
- Contact sales for custom quote

### Hybrid Approach

**Primary:** Cursor Teams for all developers (R28,416 annually)  
**Specialist:** Claude Pro for 1-2 senior developers for deep research/complex problems (+R8,880-17,760)  
**Total:** R37k-46k for maximum flexibility

---

## 8. Conclusion

Cursor Teams represents the optimal balance of capability, cost, and strategic value for our engineering team:

✅ **Most comprehensive feature set** for modern AI-assisted development  
✅ **Strong estimated ROI** with 3–10x return based on realistic productivity gains  
✅ **Team-ready** with proper security, admin controls, and collaboration features  
✅ **Future-proof** architecture supporting multiple models and evolving workflows  
✅ **Not locked in** – multi-model support means we can adapt as AI landscape evolves

The R28,416 annual investment (with annual billing discount) is modest relative to the productivity gains and positions our team to leverage AI development tools effectively as they continue to evolve.

---

## 9. Recommendation & Next Steps

### Final Recommendation

**Adopt Cursor Teams (annual billing) as our standard AI coding assistant for all 4 developers.**

### Immediate Next Steps

1. **Approval** - Secure budget approval for R28,416 annual spend (20% savings vs monthly billing)
2. **Purchase** - Acquire 4 Cursor Teams licenses with annual billing
3. **Setup** - Configure admin settings, SSO, privacy controls, and spending limits
4. **Onboarding** - Schedule team training sessions and create internal usage guidelines
5. **Pilot** - Run 30-day evaluation with metrics tracking (productivity, satisfaction, code quality)
6. **Launch** - Roll out to full team as primary development environment

### Success Metrics

Track these KPIs to measure ROI:

- **Time-to-completion** for standard features (baseline vs with Cursor)
- **Code review turnaround time** (AI-assisted vs manual)
- **Developer satisfaction** scores (monthly surveys)
- **Onboarding time** for new hires
- **Technical debt reduction** (refactoring velocity)

---

## Appendix: Reference Information

**Cursor Teams Annual Pricing:** $32/user/month (billed annually)  
**Exchange Rate Used:** 1 USD = 18.5 ZAR  
**Pricing Date:** November 2025  
**Team Size:** 4 developers  
**Total Annual Cost:** R28,416 (vs R35,520 on monthly billing)

**Document Prepared By:**
Ashley Coleman  
Engineering Team  
ashley.coleman@owlbox.com

**External Resources:**

- Cursor Documentation: https://docs.cursor.com
- Pricing Details: https://cursor.com/pricing
- Community Forum: https://forum.cursor.com
