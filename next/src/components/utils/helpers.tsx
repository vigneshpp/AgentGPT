import {
  FaBrain,
  FaCheckCircle,
  FaCircleNotch,
  FaRegCheckCircle,
  FaStar,
  FaStopCircle,
  FaThumbtack,
} from "react-icons/fa";
import type { Message } from "../../types/agentTypes";
import {
  getTaskStatus,
  MESSAGE_TYPE_GOAL,
  MESSAGE_TYPE_THINKING,
  TASK_STATUS_COMPLETED,
  TASK_STATUS_EXECUTING,
  TASK_STATUS_FINAL,
  TASK_STATUS_STARTED,
} from "../../types/agentTypes";
import type { AgentTask } from "../../services/agent/autonomous-agent";

export const getMessageContainerStyle = (message: AgentTask) => {
  // if (!isTask(message)) {
  //   return "border-white/10 hover:border-white/40";
  // }

  switch (message.status) {
    case "new":
      return "border-white/20 hover:border-white/40";
    case "running":
      return "border-white/20 hover:border-white/40";
    case "finished":
      return "border-green-500 hover:border-green-400";
    default:
      return "";
  }
};

export const getTaskStatusIcon = (
  message: Message,
  config: { [key: string]: string | boolean | undefined }
) => {
  const taskStatusIconClass = "mr-1 mb-1 inline-block";
  const { isAgentStopped } = config;

  if (message.type === MESSAGE_TYPE_GOAL) {
    return <FaStar className="text-yellow-300" />;
  } else if (message.type === MESSAGE_TYPE_THINKING) {
    return <FaBrain className="mt-[0.1em] text-pink-400" />;
  } else if (getTaskStatus(message) === TASK_STATUS_STARTED) {
    return <FaThumbtack className={`${taskStatusIconClass} -rotate-45`} />;
  } else if (getTaskStatus(message) === TASK_STATUS_EXECUTING) {
    return isAgentStopped ? (
      <FaStopCircle className={`${taskStatusIconClass}`} />
    ) : (
      <FaCircleNotch className={`${taskStatusIconClass} animate-spin`} />
    );
  } else if (getTaskStatus(message) === TASK_STATUS_COMPLETED) {
    return (
      <FaRegCheckCircle className={`${taskStatusIconClass} text-green-500 hover:text-green-400`} />
    );
  } else if (getTaskStatus(message) === TASK_STATUS_FINAL) {
    return (
      <FaCheckCircle className={`${taskStatusIconClass} text-green-500 hover:text-green-400`} />
    );
  }
};
