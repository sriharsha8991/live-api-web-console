# Live API - Web Console

This repository contains a react-based starter app for using the [Live API](<[https://ai.google.dev/gemini-api](https://ai.google.dev/api/multimodal-live)>) over a websocket. It provides modules for streaming audio playback, recording user media such as from a microphone, webcam or screen capture as well as a unified log view to aid in development of your application.

[![Live API Demo](readme/thumbnail.png)](https://www.youtube.com/watch?v=J_q7JY1XxFE)

Watch the demo of the Live API [here](https://www.youtube.com/watch?v=J_q7JY1XxFE).

## Usage

To get started, [create a free Gemini API key](https://aistudio.google.com/apikey) and add it to the `.env` file. Then:

```
$ npm install && npm start
```

We have provided several example applications on other branches of this repository:

New demos with GenAI SDK:

- [demos/proactive-audio](https://github.com/google-gemini/multimodal-live-api-web-console/tree/demos/proactive-audio) - demonstrates the Live API's [proactive audio feature](https://ai.google.dev/gemini-api/docs/live-guide#proactive-audio)


Original demos:

- [demos/GenExplainer](https://github.com/google-gemini/multimodal-live-api-web-console/tree/demos/genexplainer)
- [demos/GenWeather](https://github.com/google-gemini/multimodal-live-api-web-console/tree/demos/genweather)
- [demos/GenList](https://github.com/google-gemini/multimodal-live-api-web-console/tree/demos/genlist)

## Example

Below is an example of an entire application that will use Google Search grounding and then render graphs using [vega-embed](https://github.com/vega/vega-embed):

```typescript
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

export const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

export function Altair() {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      systemInstruction: {
        parts: [
          {
            text: 'You are my helpful assistant. Any time I ask you for a graph call the "render_altair" function I have provided you. Dont ask for additional information just make your best judgement.',
          },
        ],
      },
      tools: [{ googleSearch: {} }, { functionDeclarations: [declaration] }],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name
      );
      if (fc) {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);
  return <div className="vega-embed" ref={embedRef} />;
}
```

## development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
Project consists of:

- an Event-emitting websocket-client to ease communication between the websocket and the front-end
- communication layer for processing audio in and out
- a boilerplate view for starting to build your apps and view logs

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

_This is an experiment showcasing the Live API, not an official Google product. We’ll do our best to support and maintain this experiment but your mileage may vary. We encourage open sourcing projects as a way of learning from each other. Please respect our and other creators' rights, including copyright and trademark rights when present, when sharing these works and creating derivative work. If you want more info on Google's policy, you can find that [here](https://developers.google.com/terms/site-policies)._

## Deployment (GitHub Pages)

This project is a Create React App (CRA) build and can be statically deployed. However, the Gemini API key is required only at runtime to establish a Live API websocket connection. Embedding the key into the built JavaScript bundle (via a secret in the workflow) will expose it publicly—anyone can view it in DevTools. Recommended approaches:

### Option A (Recommended): Runtime Key Entry
Prompt the user for their API key after the app loads and store it in `localStorage` or just memory. This keeps the repository & deployed artifact free of secrets. You would replace the compile-time line:

```ts
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
```

with a runtime mechanism (input dialog / settings panel). Then pass the captured key into the `LiveAPIProvider` through `options={{ apiKey }}`. The current code will throw if the env var is missing; remove that guard when moving to runtime entry.

### Option B: Build-Time Injection (Not Secure)
Use a repo secret `REACT_APP_GEMINI_API_KEY` and reference it in the GitHub Actions workflow. This will work but the key is visible in the client bundle. Only do this if you are comfortable rotating the key and accept exposure risk.

### GitHub Pages Workflow
The repo includes `.github/workflows/deploy.yml` which:
- Installs dependencies (`npm ci`)
- Builds the app (`npm run build`)
- Publishes the `build/` directory to GitHub Pages

Ensure `package.json` has the `homepage` field set to:

```json
"homepage": "https://<your-username>.github.io/live-api-web-console"
```

### Enable Pages
1. Push to `main`.
2. In GitHub repo settings -> Pages: set Source to `GitHub Actions`.
3. Wait for the workflow to finish; the URL will appear in the workflow summary.

### Optional: Backend Proxy
If you want to fully hide the API key, create a lightweight proxy (Cloud Run / FastAPI / Express) that holds the key server-side and forwards websocket traffic. For real-time Live API usage, a direct browser → Gemini Live connection is simplest; a proxy adds latency and complexity.

### Quick Deployment Steps
```bash
git add .
git commit -m "Add Pages deployment"
git push origin main
```

Visit the Pages URL. If using runtime key collection, the UI should allow entering the key (implement an input component). After entering key, connect normally.

### Security Summary
- Never commit the API key.
- Avoid embedding secrets in front-end bundles when possible.
- Rotate keys periodically if you choose build-time injection.

