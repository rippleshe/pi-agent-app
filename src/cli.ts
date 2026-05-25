/**
 * pi-agent-app 最小示例
 *
 * 演示如何通过 pi-coding-agent SDK 创建一个 AI 编码代理会话，
 * 使用 DeepSeek V4 Flash 模型，让代理读取当前项目结构并给出分析。
 *
 * 运行方式: pnpm dev
 */

// ─── 1. 加载环境变量 ───────────────────────────────────────────────
// dotenv/config 会自动读取项目根目录的 .env 文件，将其中定义的
// 环境变量注入到 process.env 中。这里我们需要 DEEPSEEK_API_KEY。
import "dotenv/config";

// ─── 2. 导入 pi AI 模块 ────────────────────────────────────────────
// - registerBuiltInApiProviders: 注册 pi 内置的所有 AI 提供商
//   （Anthropic、OpenAI、DeepSeek、Google 等），注册后才能通过
//    getModel() 查找特定模型。
// - getModel: 根据 provider + modelId 查找已注册的模型定义。
import { getModel, registerBuiltInApiProviders } from "@earendil-works/pi-ai";

// ─── 3. 导入 pi 编码代理模块 ───────────────────────────────────────
// - AuthStorage: 管理 API Key 的存储与读取（支持 auth.json 文件、
//   环境变量、运行时覆盖三种方式）。
// - createAgentSession: 核心工厂函数，创建一个代理会话实例。
// - ModelRegistry: 模型注册表，用于查找可用模型（包括自定义模型）。
// - SessionManager: 会话管理器，控制会话的持久化方式（内存/文件）。
import {
	AuthStorage,
	createAgentSession,
	ModelRegistry,
	SessionManager,
} from "@earendil-works/pi-coding-agent";

// ─── 4. 注册内置 AI 提供商 ─────────────────────────────────────────
// 这一步必须在 getModel() 之前调用，否则模型列表为空。
// 它会注册所有 pi 内置支持的提供商（约 30+ 个），包括：
// anthropic, openai, deepseek, google, groq, mistral, amazon-bedrock 等。
registerBuiltInApiProviders();

// ─── 5. 读取 DeepSeek API Key ──────────────────────────────────────
// 从 .env 文件中加载 DEEPSEEK_API_KEY。如果没有配置，则报错退出。
const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
	console.error("Missing DEEPSEEK_API_KEY in .env");
	process.exit(1);
}

// ─── 6. 配置认证存储 ───────────────────────────────────────────────
// AuthStorage.create() 默认读取 ~/.pi/agent/auth.json（如果存在）。
// setRuntimeApiKey() 是运行时覆盖，不会写入磁盘，适合从 .env 注入密钥。
// 第一个参数 "deepseek" 是提供商 ID，与 models.generated.js 中的定义对应。
const authStorage = AuthStorage.create();
authStorage.setRuntimeApiKey("deepseek", apiKey);

// ─── 7. 创建模型注册表 ─────────────────────────────────────────────
// ModelRegistry 将 AuthStorage 和内置模型列表结合，提供按 provider/id
// 查找模型的能力。也支持从 ~/.pi/agent/models.json 加载自定义模型。
const modelRegistry = ModelRegistry.create(authStorage);

// ─── 8. 查找 DeepSeek 模型 ─────────────────────────────────────────
// getModel() 在已注册的提供商中查找指定模型。
// DeepSeek V4 Flash 是 DeepSeek 的轻量快速模型，支持 1M 上下文窗口。
// 可选的其他 DeepSeek 模型：deepseek-v4-pro（更强但更慢）。
const model = getModel("deepseek", "deepseek-v4-flash");
if (!model) {
	console.error("DeepSeek model not found");
	process.exit(1);
}

console.log(`Using model: ${model.provider}/${model.id}\n`);

// ─── 9. 创建代理会话 ───────────────────────────────────────────────
// createAgentSession() 是核心入口，返回 { session, extensionsResult }。
//
// 参数说明：
// - model: 使用的 AI 模型（上一步查找到的 DeepSeek V4 Flash）
// - thinkingLevel: 思考级别，"off" 表示不输出思考过程
//   其他选项: "minimal" | "low" | "medium" | "high" | "xhigh"
// - authStorage / modelRegistry: 认证和模型配置
// - sessionManager: SessionManager.inMemory() 表示会话仅存于内存，
//   不持久化到磁盘。适合一次性演示场景。
// - tools: 代理可用的内置工具列表：
//   "read"   - 读取文件内容
//   "bash"   - 执行 shell 命令
//   "grep"   - 搜索文件内容（正则匹配）
//   "find"   - 按文件名模式查找文件
//   "ls"     - 列出目录内容
const { session } = await createAgentSession({
	model,
	thinkingLevel: "off",
	authStorage,
	modelRegistry,
	sessionManager: SessionManager.inMemory(),
	tools: ["read", "bash", "grep", "find", "ls"],
});

// ─── 10. 订阅事件流 ────────────────────────────────────────────────
// subscribe() 注册事件监听器，用于接收代理的实时输出。
// 事件类型包括：
// - "message_update"     : 助手消息更新（文本/思考/工具调用的增量内容）
// - "tool_execution_start" : 工具开始执行
// - "tool_execution_end"   : 工具执行结束
// - "agent_start"          : 代理开始处理
// - "agent_end"            : 代理处理完成
// - "turn_start" / "turn_end" : 一轮 LLM 调用的开始/结束
//
// 这里只处理 text_delta 事件，将代理输出的文本增量实时写入 stdout，
// 实现类似打字机的流式输出效果。
session.subscribe((event) => {
	if (
		event.type === "message_update" &&
		event.assistantMessageEvent.type === "text_delta"
	) {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

// ─── 11. 发送提示词 ────────────────────────────────────────────────
// session.prompt() 将用户的文字发送给代理，代理会利用已配置的工具
// （read/bash/grep/find/ls）来完成任务，然后返回结果。
// 整个过程是异步的：代理可能需要多轮 LLM 调用 + 工具执行才能完成。
await session.prompt(
	"请简要介绍一下当前目录下的项目结构，列出主要文件并说明用途。回答用中文。",
);

// ─── 12. 清理资源 ──────────────────────────────────────────────────
// dispose() 释放会话占用的资源（关闭连接、清理监听器等）。
console.log("\n\n--- Done ---");
session.dispose();
