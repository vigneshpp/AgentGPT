import { api } from "../utils/api";
import type { Message } from "../types/agentTypes";
import { useAuth } from "./useAuth";
import AutonomousAgent, { AgentTask } from "../services/agent/autonomous-agent";
import { useRef, useState } from "react";
import type { ModelSettings } from "../utils/types";

export interface SaveProps {
  name: string;
  goal: string;
  tasks: Message[];
}

export function useAgent() {
  const { status } = useAuth();
  const utils = api.useContext();
  const { session } = useAuth();

  const loops = useRef(0);
  const [agent, setAgent] = useState<AutonomousAgent>();
  const [tasks, setTasks] = useState<{
    [key: string]: AgentTask;
  }>({});

  const saveMutation = api.agent.create.useMutation({
    onSuccess: (data) => {
      utils.agent.getAll.setData(undefined, (oldData) => [data, ...(oldData ?? [])]);
    },
  });

  const saveAgent = (data: SaveProps) => {
    if (status === "authenticated") saveMutation.mutate(data);
  };

  const startAgent = async ({
    name,
    goal,
    settings,
  }: {
    name: string;
    goal: string;
    settings: ModelSettings;
  }) => {
    const newAgent = new AutonomousAgent(
      name.trim(),
      goal.trim(),
      {
        beforeLoop: () => {
          loops.current++;
          if (loops.current > 5) {
            throw new Error("Too many loops");
          }
        },
        afterLoop: () => {},
        onShutdown() {
          console.log("onShutdown");
        },
        onTaskUpdate(task) {
          console.log({ ...tasks, [task.id]: task });
          console.log("onTaskUpdate", task);
          setTasks((oldTasks) => ({ ...oldTasks, [task.id]: task }));
          console.log(tasks);
        },
      },
      settings
      // session ?? undefined
    );

    setAgent(newAgent);
    return await newAgent.run();
  };

  const stopAgent = () => {
    //TODO: implement agent stopping
    // agent?.stop();
  };

  return {
    agent,
    tasks: Object.values(tasks),
    startAgent,
    stopAgent,
    saveAgent,
  };
}
