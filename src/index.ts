import "dotenv/config";
import { getModel, registerBuiltInApiProviders } from "@earendil-works/pi-ai";
import {
	AuthStorage,
	createAgentSession,
	ModelRegistry,
	SessionManager,
} from "@earendil-works/pi-coding-agent";

registerBuiltInApiProviders();

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
	console.error("Missing DEEPSEEK_API_KEY in .env");
	process.exit(1);
}

// Set up auth with DeepSeek API key
const authStorage = AuthStorage.create();
authStorage.setRuntimeApiKey("deepseek", apiKey);

const modelRegistry = ModelRegistry.create(authStorage);

// Find DeepSeek model
const model = getModel("deepseek", "deepseek-v4-flash");
if (!model) {
	console.error("DeepSeek model not found");
	process.exit(1);
}

console.log(`Using model: ${model.provider}/${model.id}\n`);

const { session } = await createAgentSession({
	model,
	thinkingLevel: "off",
	authStorage,
	modelRegistry,
	sessionManager: SessionManager.inMemory(),
	tools: ["read", "bash", "grep", "find", "ls"],
});

// Stream response to stdout
session.subscribe((event) => {
	if (
		event.type === "message_update" &&
		event.assistantMessageEvent.type === "text_delta"
	) {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

// Ask the agent to inspect the current project
await session.prompt(
	"请简要介绍一下当前目录下的项目结构，列出主要文件并说明用途。回答用中文。",
);

console.log("\n\n--- Done ---");
session.dispose();
