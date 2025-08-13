import { getCollection } from '../lib/db.js';
import { generateEmbedding } from '../lib/search.js';

async function createTestSOP() {
  try {
    const { client, collection } = await getCollection('sop');
    
    const testSOP = {
      title: "IT Incident Resolution Process",
      content: `
<h2>1. Goal</h2>
<p>To provide a structured approach for identifying, assessing, and resolving IT incidents in a timely and efficient manner while minimizing business impact.</p>

<h2>2. Scope</h2>
<p>This SOP applies to all IT incidents reported by users, detected by monitoring systems, or identified during routine operations. It covers incidents affecting hardware, software, networks, and IT services.</p>

<h2>3. Responsibilities</h2>
<p>- IT Support Team: Initial incident assessment and basic troubleshooting<br>
- IT Specialists: Technical resolution of complex incidents<br>
- IT Manager: Escalation decisions and resource allocation<br>
- Business Stakeholders: Impact assessment and communication</p>

<h2>4. Prerequisites</h2>
<p>- Incident Management System access<br>
- Monitoring tools and alerting systems<br>
- Technical documentation and knowledge base<br>
- Communication channels established</p>

<h2>5. Procedure / Steps</h2>
<p><strong>Step 1: Incident Identification</strong><br>
- Monitor automated alerts and system notifications<br>
- Review user reports and service desk tickets<br>
- Conduct routine system health checks<br>
- Document incident details including time, description, and affected systems</p>

<p><strong>Step 2: Incident Logging</strong><br>
- Create incident ticket in Incident Management System<br>
- Assign unique incident ID<br>
- Record initial assessment and priority level<br>
- Notify relevant stakeholders</p>

<p><strong>Step 3: Initial Assessment</strong><br>
- Evaluate incident impact on business operations<br>
- Determine urgency and priority classification<br>
- Identify affected users, systems, and services<br>
- Assess potential business impact and downtime</p>

<p><strong>Step 4: Incident Escalation</strong><br>
- Route incident to appropriate technical team<br>
- Escalate to senior staff if resolution time exceeds SLA<br>
- Notify management for high-priority incidents<br>
- Coordinate with external vendors if required</p>

<p><strong>Step 5: Resolution and Recovery</strong><br>
- Implement technical solution to resolve incident<br>
- Test resolution to ensure problem is fixed<br>
- Restore affected systems and services<br>
- Verify normal operations are resumed</p>

<p><strong>Step 6: Incident Closure</strong><br>
- Update incident ticket with resolution details<br>
- Obtain user confirmation of resolution<br>
- Close incident in management system<br>
- Communicate resolution to stakeholders</p>

<p><strong>Step 7: Review and Documentation</strong><br>
- Conduct post-incident review meeting<br>
- Document lessons learned and improvement opportunities<br>
- Update procedures and documentation as needed<br>
- Identify preventive measures for future incidents</p>

<h2>6. KPIs / Success Metrics</h2>
<p>- Mean Time to Resolution (MTTR)<br>
- Mean Time to Detect (MTTD)<br>
- Incident resolution rate within SLA<br>
- User satisfaction scores<br>
- Number of repeat incidents</p>

<h2>7. Exceptions</h2>
<p>This SOP does not apply to:<br>
- Planned maintenance activities<br>
- Security breaches (follow Security Incident Response Plan)<br>
- Disaster recovery scenarios (follow DR procedures)<br>
- Change management activities</p>

<h2>8. Safety or Compliance Considerations</h2>
<p>- Follow data protection regulations when handling user data<br>
- Maintain audit trails for all incident activities<br>
- Ensure compliance with industry-specific regulations<br>
- Protect sensitive information during incident resolution</p>

<h2>9. References</h2>
<p>- Security Incident Response Plan<br>
- Disaster Recovery Procedures<br>
- Change Management Process<br>
- Service Level Agreements<br>
- Technical Documentation Library</p>

<h2>10. Completion Checklist</h2>
<p>Before marking incident as complete:<br>
- Incident is fully resolved and tested<br>
- All affected systems are operational<br>
- Users confirm resolution<br>
- Incident ticket is properly documented<br>
- Post-incident review is scheduled<br>
- Lessons learned are documented</p>`,
      tags: ["IT", "incident", "resolution", "troubleshooting", "support", "emergency"],
      organization: "test-org",
      version: 1.0,
      assignedTo: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate embedding for the content
    const contentVector = await generateEmbedding(testSOP.content);
    testSOP.contentVector = contentVector;

    // Insert the SOP
    const result = await collection.insertOne(testSOP);
    
    console.log("✅ Test SOP created successfully with ID:", result.insertedId);
    
    await client.close();
    
  } catch (error) {
    console.error("❌ Error creating test SOP:", error);
  }
}

// Run the function
createTestSOP(); 