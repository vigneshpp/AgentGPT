/* eslint-disable @typescript-eslint/no-empty-function */
import AutonomousAgent from "../src/services/agent/autonomous-agent";
import { forEach } from "lodash";

jest.mock("../src/services/agent/agent-api", () => {
  return {
    // mock here
    AgentApi: jest.fn().mockImplementation(() => {
      return {
        getInitialTasks: jest.fn().mockImplementation(() => ["task1", "task2"]),
        analyzeTask: jest.fn().mockImplementation(() => {
          return {
            reasoning: "reasoning",
          };
        }),
        executeTask: jest.fn().mockImplementation(() => []),
        getAdditionalTasks: jest.fn().mockImplementation(() => []),
      };
    }),
  };
});

test("smoke", async () => {
  const stubCallbacks = {
    beforeLoop: jest.fn(),
    afterLoop: jest.fn(),
    onMessage: jest.fn(),
    onShutdown: jest.fn(),
    onTaskUpdate: jest.fn(),
  };

  const agent = new AutonomousAgent("name", "goal", stubCallbacks, {});

  await agent.run();
  expect(agent).toBeDefined();
  expect(agent.taskQueue.length).toBe(4);
  expect(stubCallbacks.beforeLoop).toBeCalledTimes(2);
  expect(stubCallbacks.afterLoop).toBeCalledTimes(2);
  forEach(agent.taskQueue, (task) => {
    expect(task.status).toBe("finished");
  });
});
