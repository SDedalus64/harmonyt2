const fetch = require('node-fetch');
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;

const openai = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

module.exports = async function (context, req) {
  const rssUrl = req.query.url;
  if (!rssUrl) {
    context.res = {
      status: 400,
      body: "Missing ?url parameter"
    };
    return;
  }

  try {
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();

    const parsed = await parseRss(rssText);
    const summarized = await Promise.all(parsed.map(async (item) => {
      try {
        const summary = await getSummary(item.title, item.description);
        return {
          title: item.title,
          summary,
          date: item.date,
          url: item.link,
          image: item.image || process.env.DEFAULT_IMAGE
        };
      } catch (err) {
        return { ...item, summary: "(Could not summarize)" };
      }
    }));

    context.res = {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: summarized
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: "Failed to process feed: " + err.message
    };
  }
};

async function parseRss(xml) {
  const { parseStringPromise } = require('xml2js');
  const json = await parseStringPromise(xml);
  const items = json.rss.channel[0].item || [];
  return items.map(i => ({
    title: i.title[0],
    description: i.description ? i.description[0] : "",
    date: new Date(i.pubDate[0]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    link: i.link[0],
    image: extractImageFromDescription(i.description?.[0])
  }));
}

function extractImageFromDescription(desc = "") {
  const match = desc.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

async function getSummary(title, description) {
  const prompt = `Summarize this news item clearly and concisely:\n\nTitle: ${title}\n\nContent: ${description}`;
  const response = await openai.getCompletions(deploymentName, [{ prompt, max_tokens: 120 }]);
  return response.choices[0].text.trim();
}
