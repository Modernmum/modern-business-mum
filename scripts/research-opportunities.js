/**
 * OPPORTUNITY RESEARCHER
 * Uses Perplexity to find real-time money-making opportunities
 */

import { generateText } from '../lib/ai.js';

const researchOpportunities = async () => {
  console.log('\n🔍 RESEARCHING MONEY-MAKING OPPORTUNITIES...\n');

  const query = `Research the fastest ways to make money online in December 2024 for someone who has:
- 100 Notion templates ready to sell
- Stripe payment processing
- A Perplexity AI API key
- Basic coding skills
- Limited marketing budget

Focus on:
1. Marketplaces with built-in traffic (Etsy, Gumroad alternatives, Creative Market, etc.)
2. Immediate revenue opportunities (within 7-14 days)
3. Low/no upfront cost
4. Automated or semi-automated approaches
5. Proven conversion rates for digital products

For each opportunity, provide:
- Platform name
- Setup time
- Expected time to first sale
- Potential monthly revenue
- Requirements/barriers
- Automation potential

Output as JSON array with this structure:
{
  "opportunities": [
    {
      "platform": "name",
      "type": "marketplace/service/affiliate",
      "setupTime": "X hours",
      "timeToFirstSale": "X days",
      "monthlyRevenuePotential": "$X-Y",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"],
      "requirements": ["req1", "req2"],
      "automationPotential": "high/medium/low",
      "actionSteps": ["step1", "step2"]
    }
  ]
}`;

  try {
    const result = await generateText(query, 'json');

    console.log('\n📊 OPPORTUNITIES FOUND:\n');
    console.log(JSON.stringify(result, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 TOP 3 FASTEST OPPORTUNITIES:\n');

    const sorted = result.opportunities
      .sort((a, b) => {
        const timeA = parseInt(a.timeToFirstSale);
        const timeB = parseInt(b.timeToFirstSale);
        return timeA - timeB;
      })
      .slice(0, 3);

    sorted.forEach((opp, i) => {
      console.log(`${i + 1}. ${opp.platform}`);
      console.log(`   Setup: ${opp.setupTime}`);
      console.log(`   First Sale: ${opp.timeToFirstSale}`);
      console.log(`   Revenue: ${opp.monthlyRevenuePotential}`);
      console.log(`   Automation: ${opp.automationPotential}`);
      console.log(`   Next Steps:`);
      opp.actionSteps.slice(0, 3).forEach(step => console.log(`   - ${step}`));
      console.log('');
    });

    console.log('='.repeat(80));

    return result;

  } catch (error) {
    console.error('❌ Research failed:', error.message);
    throw error;
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  researchOpportunities()
    .then(() => {
      console.log('\n✅ Research complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Research failed:', error);
      process.exit(1);
    });
}

export { researchOpportunities };
