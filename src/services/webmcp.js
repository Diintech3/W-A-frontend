import { campaignsApi, templatesApi, contactsApi, analyticsApi } from './api';

export function initializeWebMCP() {
  const context = window.modelContext || document.modelContext || navigator.modelContext;
  if (!context) {
    console.log("WebMCP not supported in this browser environment.");
    return;
  }

  // 1. List Templates
  context.registerTool({
    name: "whats_ai_list_templates",
    description: "Retrieve all templates assigned to the logged-in client.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      const res = await templatesApi.list();
      return res.data;
    }
  });

  // 2. List Campaigns
  context.registerTool({
    name: "whats_ai_list_campaigns",
    description: "Get a list of all WhatsApp marketing campaigns.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      const res = await campaignsApi.list();
      return res.data;
    }
  });

  // 3. Create Campaign
  context.registerTool({
    name: "whats_ai_create_campaign",
    description: "Create a new WhatsApp marketing campaign.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the campaign" },
        targetGroup: { type: "string", description: "The name of the target contact group/list" },
        template: { type: "string", description: "Template database ID" },
        scheduledAt: { type: "string", description: "Optional ISO datetime string to schedule campaign for the future" },
        photoshareFolderId: { type: "string", description: "Optional photoshare folder database ID to link with" }
      },
      required: ["name", "targetGroup", "template"]
    },
    async execute(args) {
      const res = await campaignsApi.create(args);
      return res.data;
    }
  });

  // 4. Send Campaign
  context.registerTool({
    name: "whats_ai_send_campaign",
    description: "Start running / send an existing campaign immediately.",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "The database ID of the campaign to send" }
      },
      required: ["campaignId"]
    },
    async execute({ campaignId }) {
      const res = await campaignsApi.send(campaignId);
      return res.data;
    }
  });

  // 5. List Contact Groups
  context.registerTool({
    name: "whats_ai_list_contact_groups",
    description: "Retrieve all contact groups and lists.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      const res = await contactsApi.groups();
      return res.data;
    }
  });

  // 6. Analytics Overview
  context.registerTool({
    name: "whats_ai_get_analytics_overview",
    description: "Retrieve dashboard marketing analytics and message statistics.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      const res = await analyticsApi.overview();
      return res.data;
    }
  });

  console.log("WebMCP tools registered successfully!");
}
