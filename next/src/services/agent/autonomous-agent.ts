import type { ModelSettings } from "../../utils/types";
import type { Awaitable, Session } from "next-auth";
import { AgentApi } from "./agent-api";

// Task in queue
// Task started
//    Analysis
//    Execution
//    Analysis
//    ....
// Task finished

export interface EventCallbacks {
  beforeLoop: () => void;
  afterLoop: () => void;
  onShutdown: () => void;
  onTaskUpdate(task: AgentTask): void;
}

export interface AgentTask {
  id: string;
  input: string;
  output: string;
  status: "new" | "running" | "finished";
}

class AutonomousAgent {
  name: string;
  goal: string;
  modelSettings: ModelSettings;
  session?: Session;
  callbacks: EventCallbacks;
  $api: AgentApi;

  _curr = 0;
  taskQueue: AgentTask[];
  _id = 0;

  constructor(name: string, goal: string, callbacks: EventCallbacks, modelSettings: ModelSettings) {
    this.name = name;
    this.goal = goal;
    this.callbacks = callbacks;
    this.modelSettings = modelSettings;
    this.taskQueue = [];

    this.$api = new AgentApi({
      goal,
      modelSettings,
    });
  }

  async run() {
    const initialTasks = async () => await this.$api.getInitialTasks();
    await this.addTasks(initialTasks);
    await this.loop();
  }
  private async loop() {
    if (this.remainingTasks().length === 0) {
      return;
    }

    this.callbacks.beforeLoop();

    this.currentTask().status = "running";
    this.callbacks.onTaskUpdate(this.currentTask());

    const analysis = await this.$api.analyzeTask(this.currentTask().input);
    this.currentTask().status = "finished";
    this.currentTask().output = analysis.reasoning; //TODO: make this and object
    this.callbacks.onTaskUpdate(this.currentTask());

    // Execute task
    this.taskQueue.splice(this._curr + 1, 0, {
      id: `${++this._id}`,
      input: this.currentTask().output,
      output: "",
      status: "running",
    });

    this._curr++;
    this.callbacks.onTaskUpdate(this.currentTask());

    const result = await this.$api.executeTask(this.currentTask().output, analysis);
    this.currentTask().status = "finished";
    this.currentTask().output = result;
    this.callbacks.onTaskUpdate(this.currentTask());

    // Add new tasks

    await this.addTasks(this.getMoreTasks(result));
    this._curr++;

    this.callbacks.afterLoop();

    // Loop again
    await this.loop();
  }

  private getMoreTasks = (result: string) => async () =>
    await this.$api.getAdditionalTasks(
      {
        current: this.currentTask().input,
        remaining: this.remainingTasks().map((task) => task.input),
        completed: this.completedTasks().map((task) => task.input),
      },
      result
    );

  private async addTasks(source: () => Awaitable<string[]>) {
    for (const value of await source()) {
      this.taskQueue.push({
        id: `${++this._id}`,
        input: value,
        output: "",
        status: "new",
      });
    }
  }

  private currentTask(): AgentTask {
    return this.taskQueue[this._curr] as AgentTask;
  }

  private remainingTasks(): AgentTask[] {
    return this.taskQueue.filter((t) => t.status === "new");
  }

  private completedTasks(): AgentTask[] {
    return this.taskQueue.filter((t) => t.status === "finished");
  }
}

export default AutonomousAgent;
