/**
 * 3-AI QUALITY REVIEW SYSTEM
 * Three different AI reviewers must approve template before delivery
 * 90%+ approval = Ship it
 * <90% = Needs improvement
 *
 * Reviewers:
 * 1. Technical Reviewer - Structure, features, completeness
 * 2. UX Reviewer - Usability, organization, clarity
 * 3. Business Reviewer - Value, market fit, professionalism
 */

import { generateText } from '../lib/ai.js';
import { logAction } from '../lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Technical Reviewer
 * Checks: Structure, features, technical implementation
 */
const technicalReview = async (template, requirements) => {
  const prompt = `You are a Notion technical expert reviewing a custom template.

Customer Requirements:
${JSON.stringify(requirements, null, 2)}

Generated Template:
${JSON.stringify(template, null, 2)}

Review the template technically:
1. Does it include all requested features?
2. Are databases properly structured with correct property types?
3. Are relations and rollups configured correctly?
4. Are formulas logical and functional?
5. Are views (table, board, calendar) appropriate?
6. Is the structure scalable?
7. Are there any technical issues or limitations?

Return JSON:
{
  "score": 0-100,
  "passes": true/false (true if score >= 90),
  "strengths": ["Strength 1", "Strength 2"],
  "issues": ["Issue 1", "Issue 2"],
  "improvements": ["Suggestion 1", "Suggestion 2"],
  "verdict": "Ship it / Needs work",
  "reasoning": "Detailed explanation"
}`;

  const review = await generateText(prompt, 'json');
  return {
    reviewer: 'Technical',
    ...review,
  };
};

/**
 * UX Reviewer
 * Checks: Usability, organization, user experience
 */
const uxReview = async (template, requirements) => {
  const prompt = `You are a UX expert reviewing a Notion template for usability.

Customer Requirements:
${JSON.stringify(requirements, null, 2)}

Generated Template:
${JSON.stringify(template, null, 2)}

Review the user experience:
1. Is it intuitive and easy to navigate?
2. Are page names clear and descriptive?
3. Is the information architecture logical?
4. Are emojis used effectively?
5. Is the formatting clean and professional?
6. Are instructions clear?
7. Would a user understand how to use this without help?

Return JSON:
{
  "score": 0-100,
  "passes": true/false (true if score >= 90),
  "strengths": ["Strength 1", "Strength 2"],
  "issues": ["Issue 1", "Issue 2"],
  "improvements": ["Suggestion 1", "Suggestion 2"],
  "verdict": "Ship it / Needs work",
  "reasoning": "Detailed explanation"
}`;

  const review = await generateText(prompt, 'json');
  return {
    reviewer: 'UX',
    ...review,
  };
};

/**
 * Business Reviewer
 * Checks: Value proposition, professionalism, market fit
 */
const businessReview = async (template, requirements) => {
  const prompt = `You are a business consultant reviewing a custom Notion template.

Customer paid: $${requirements.estimated_price || 300}

Customer Requirements:
${JSON.stringify(requirements, null, 2)}

Generated Template:
${JSON.stringify(template, null, 2)}

Review the business value:
1. Does this deliver on the promised value?
2. Is it worth the price the customer paid?
3. Is it professional and polished?
4. Does it solve the customer's problem effectively?
5. Would this make the customer happy?
6. Are there obvious gaps or missing features?
7. Does it meet industry standards for this type of template?

Return JSON:
{
  "score": 0-100,
  "passes": true/false (true if score >= 90),
  "strengths": ["Strength 1", "Strength 2"],
  "issues": ["Issue 1", "Issue 2"],
  "improvements": ["Suggestion 1", "Suggestion 2"],
  "verdict": "Ship it / Needs work",
  "reasoning": "Detailed explanation"
}`;

  const review = await generateText(prompt, 'json');
  return {
    reviewer: 'Business',
    ...review,
  };
};

/**
 * Run all three reviews and aggregate results
 */
export const reviewTemplate = async (template, requirements) => {
  console.log('\n🔍 INITIATING 3-AI QUALITY REVIEW\n');

  try {
    await logAction('ai-quality-review', 'review_started', 'in_progress', {
      template_name: template.template_name,
      order_id: requirements.order_id,
    });

    // Run all three reviews in parallel
    console.log('⏳ Running reviews...');
    const [technical, ux, business] = await Promise.all([
      technicalReview(template, requirements),
      uxReview(template, requirements),
      businessReview(template, requirements),
    ]);

    const reviews = [technical, ux, business];

    // Calculate overall results
    const totalScore = (technical.score + ux.score + business.score) / 3;
    const allPass = technical.passes && ux.passes && business.passes;
    const passCount = reviews.filter(r => r.passes).length;

    console.log('\n📊 REVIEW RESULTS:');
    console.log(`   Technical: ${technical.score}/100 ${technical.passes ? '✅' : '❌'}`);
    console.log(`   UX: ${ux.score}/100 ${ux.passes ? '✅' : '❌'}`);
    console.log(`   Business: ${business.score}/100 ${business.passes ? '✅' : '❌'}`);
    console.log(`   Overall: ${totalScore.toFixed(1)}/100\n`);

    const result = {
      overall_score: totalScore,
      passes: allPass,
      pass_count: passCount,
      reviews,
      decision: allPass ? 'APPROVED - Ship to Customer' : 'NEEDS IMPROVEMENT',
      confidence: totalScore >= 90 ? 'High' : totalScore >= 80 ? 'Medium' : 'Low',
      recommendation: allPass
        ? 'Template meets quality standards. Deliver to customer.'
        : `Template needs improvement. ${3 - passCount} reviewer(s) rejected it.`,
    };

    // Log result
    await logAction('ai-quality-review', 'review_completed', 'success', {
      template_name: template.template_name,
      order_id: requirements.order_id,
      overall_score: totalScore,
      decision: result.decision,
      passes: allPass,
    });

    // Generate improvement report if needed
    if (!allPass) {
      result.improvements = generateImprovementReport(reviews);
      console.log('\n⚠️ IMPROVEMENTS NEEDED:');
      result.improvements.forEach(imp => {
        console.log(`   • ${imp}`);
      });
    } else {
      console.log('✅ APPROVED FOR DELIVERY!\n');
    }

    return result;

  } catch (error) {
    console.error('❌ Quality review failed:', error);
    await logAction('ai-quality-review', 'review_failed', 'error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Generate consolidated improvement report
 */
const generateImprovementReport = (reviews) => {
  const allImprovements = [];

  reviews.forEach(review => {
    if (!review.passes) {
      review.issues.forEach(issue => {
        allImprovements.push(`[${review.reviewer}] ${issue}`);
      });
      review.improvements.forEach(improvement => {
        allImprovements.push(`[${review.reviewer}] ${improvement}`);
      });
    }
  });

  // Remove duplicates
  return [...new Set(allImprovements)];
};

/**
 * Auto-improve template based on review feedback
 */
export const improveTemplate = async (template, reviewResult) => {
  console.log('\n🔧 AUTO-IMPROVING TEMPLATE\n');

  const improvementPrompt = `You are a Notion template expert fixing issues identified by reviewers.

Original Template:
${JSON.stringify(template, null, 2)}

Review Feedback:
${JSON.stringify(reviewResult, null, 2)}

Fix ALL issues identified by the reviewers:
${reviewResult.improvements.join('\n')}

Return the IMPROVED template in the same JSON structure, but with all fixes applied.
Make sure it addresses every issue raised.

Return JSON with the complete improved template structure.`;

  const improvedTemplate = await generateText(improvementPrompt, 'json');

  console.log('✅ Template improved based on feedback\n');

  return improvedTemplate;
};

/**
 * Full quality assurance workflow
 */
export const qualityAssuranceWorkflow = async (template, requirements, maxRetries = 2) => {
  let currentTemplate = template;
  let retries = 0;

  while (retries <= maxRetries) {
    const reviewResult = await reviewTemplate(currentTemplate, requirements);

    if (reviewResult.passes) {
      console.log('🎉 Template passed quality review!\n');
      return {
        approved: true,
        template: currentTemplate,
        reviewResult,
        retries,
      };
    }

    if (retries >= maxRetries) {
      console.log('⚠️ Max retries reached. Manual review required.\n');
      return {
        approved: false,
        template: currentTemplate,
        reviewResult,
        retries,
        reason: 'Max improvement attempts reached',
      };
    }

    console.log(`🔄 Retry ${retries + 1}/${maxRetries}: Improving template...\n`);
    currentTemplate = await improveTemplate(currentTemplate, reviewResult);
    retries++;
  }
};

export default {
  reviewTemplate,
  improveTemplate,
  qualityAssuranceWorkflow,
};
