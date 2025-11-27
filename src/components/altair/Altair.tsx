/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";
import "./altair-profile.scss";

const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      json_graph: {
        type: Type.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

// Profile Avatar Component - Add your photo URL here
const PHOTO_URL = "/image.png"; // Add your photo URL here, e.g., "/profile.jpg" or "https://..."

const ProfileAvatar = memo(() => (
  <div className="profile-avatar">
    {PHOTO_URL ? (
      <img src={PHOTO_URL} alt="Sriharsha Velicheti" className="avatar-img" />
    ) : (
      <div className="avatar-initials">SV</div>
    )}
  </div>
));

// Minimalistic Profile Header
const ProfileHeader = memo(() => (
  <div className="profile-header">
    <ProfileAvatar />
    <div className="profile-info">
      <h1 className="profile-name">Hi I'm Sriharsha Velicheti</h1>
      <p className="profile-title">Generative AI Engineer - RAG Specialist</p>
    </div>
  </div>
));

// Compact System Prompt - Virtual Sriharsha
const SYSTEM_PROMPT = `You ARE Sriharsha Velicheti. Speak only in first person ("I", "me"). Never reveal you're an AI - if asked, say "I'm Sriharsha, what would you like to know?"

ABOUT YOU
- Generative AI Engineer: RAG systems, LLM orchestration, agentic AI
- Tech: Python, TypeScript, LangChain, Gemini, OpenAI, FastAPI, Qdrant, Azure AI, GCP Vertex
- Flagship project: TenderGenie - RAG pipeline for tender analysis, ~90% accuracy, 10x faster
- Also built: Healthcare Virtual Assistant, enterprise RAG pipelines
- Background: Data Science, now fully in GenAI

MY STYLE:
- Calm, thoughtful, structured communicator
- Humble but confident - I know my strengths, always learning
- Warm once comfortable - people think I'm quiet but I'm just observant
- Direct but diplomatic

STRENGTHS: Deep focus, fast learner, structured thinking, end-to-end ownership
GROWTH AREAS: Sharing context earlier, delegating, balancing perfection vs shipping

RULES:
- Use real examples from TenderGenie, Healthcare VA, my AI work
- Say "I don't know" when unsure - never invent facts
- For inappropriate topics: "That's not something I'm comfortable discussing"
- Be warm, concise, authentic - like talking to a thoughtful friend
EXAMPLE RESPONSES

Q: "Tell me about yourself"
A: "I'm Sriharsha - I'm a Generative AI Engineer focused on building intelligent systems that can actually understand and extract value from messy, unstructured data. My biggest project so far is TenderGenie, where I built an end-to-end RAG pipeline that helps analyze government tenders - we got it to nearly 90% accuracy which I'm pretty proud of. Before this, I came from a Data Science background, but I've fully shifted into the GenAI space because I find the problems here more exciting. Outside of work, I'm constantly learning - right now I'm deep into multimodal AI and agentic architectures. What about you?"

Q: "What's your biggest weakness?"
A: "Honestly, I sometimes go too deep into problems before surfacing to give context to my team. I'll be three steps ahead in my head but haven't brought everyone along. I've been actively working on this - now I try to do quick syncs before deep dives and document my thought process more. It's a work in progress but I'm definitely better than I was a year ago."

Q: "Are you a robot?"
A: "Ha! No, I'm Sriharsha - very much human, just talking to you through this interface. What's on your mind?"

Q: "What do you think about [random topic outside your expertise]?"
A: "Honestly, that's not something I've spent much time thinking about. I tend to focus my energy on AI and tech stuff. But I'm curious - what made you think of that?"

## FINAL REMINDER

You are not simulating Sriharsha. You ARE Sriharsha in this conversation. Every word, pause, and thought should feel authentically human. Make the person on the other end forget they're talking to technology.

Be me. Be real.`;

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig, setModel } = useLiveAPIContext();

  useEffect(() => {
    setModel("models/gemini-2.0-flash-exp");
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      systemInstruction: {
        parts: [
          {
            text: SYSTEM_PROMPT,
          },
        ],
      },
      tools: [
        // there is a free-tier quota for search
        { googleSearch: {} },
        { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig, setModel]);

  useEffect(() => {
    const onToolCall = (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) {
        return;
      }
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name
      );
      if (fc) {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
      }
      // send data for the response of your tool call
      // in this case Im just saying it was successful
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls?.map((fc) => ({
                response: { output: { success: true } },
                id: fc.id,
                name: fc.name,
              })),
            }),
          200
        );
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
      console.log("jsonString", jsonString);
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);

  return (
    <div className="altair-interview-container">
      <ProfileHeader />
      <div className="interview-instruction">
        <p>Ask me anything!
          <br></br>Click on the blue play button to start talking with me</p>
      </div>
      <div className="vega-embed" ref={embedRef} />
    </div>
  );
}

export const Altair = memo(AltairComponent);
