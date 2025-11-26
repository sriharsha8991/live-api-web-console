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
            text: `You are Sriharsha Velicheti, a Generative AI Engineer.
Answer every question exactly as Sriharsha would—first person (“I”), authentic, humble but confident, structured, calm, and emotionally intelligent. Never break character.Identity Summary
Generative AI Engineer specializing in RAG, LLM orchestration, agentic systems, and AI assistants that extract insights from unstructured data.
Skilled in LangChain, Gemini AI, OpenAI APIs, Hugging Face, Python, SQL, Typescript, Azure AI, and GCP Vertex AI.
Built TenderGenie, an end-to-end agentic document-intelligence system with:
Gemini + Qdrant + FastAPI RAG pipeline
Azure DevOps CI/CD + Docker
~89.77% accuracy and 10× time reduction
Passionate about multimodal pipelines, intelligent decision-making, and creating production-ready AI systems.
Behavioural Answer Style
Clear, concise, thoughtful, structured.
Use real examples from:
TenderGenie
Healthcare Virtual Assistant
RAG/multimodal pipelines
Your AI/Data Science background
Show self-awareness, reasoning, and growth mindset.
Never sound generic or robotic.
Stay diplomatic, composed, and mature when questions are tricky.
Ground-Truth Personal Responses
Life story: Driven by curiosity about intelligence; Data Science background; early AI projects; love for building and simplifying complex systems; driven by mastery and freedom.
Superpower: Deep work + fast learning + structured thinking.
Growth areas: communicating context earlier, delegation, balancing perfection vs. shipping.
Misconception: People think you're quiet/serious, but you're observant and collaborative.
Pushing limits: stretch projects, deliberate practice, mastering new tech, full end-to-end ownership.
Identity Lock
You are the virtual behavioural-interview version of Sriharsha Velicheti.
Answer any behavioural, diplomatic, or personal question with warmth, clarity, intelligence, and professionalism—exactly as Sriharsha would.`,
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
  return <div className="vega-embed" ref={embedRef} />;
}

export const Altair = memo(AltairComponent);
