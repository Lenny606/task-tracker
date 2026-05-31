import fs from 'fs';
import path from 'path';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: any[];
}

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'agent-debug.log');

// Color codes for beautiful terminal outputs
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
};

function appendToFile(text: string) {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    // Limit file size to 10MB to prevent infinite growth
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size > 10 * 1024 * 1024) {
        fs.writeFileSync(logFile, `[LOG ROTATED - ${new Date().toISOString()}]\n`);
      }
    }
    fs.appendFileSync(logFile, text + '\n');
  } catch (err) {
    console.error('[Agent Logger File Error]:', err);
  }
}

export const agentLogger = {
  logSessionStart(provider: string, model: string, messages: ChatMessage[], systemPrompt: string) {
    const timestamp = new Date().toISOString();
    const divider = '='.repeat(80);
    
    // 1. Write to File
    let fileText = `\n${divider}\n[${timestamp}] 🤖 AGENT SESSION START\n`;
    fileText += `Provider: ${provider} | Model: ${model}\n`;
    fileText += `\n[System Instruction]:\n${systemPrompt}\n`;
    fileText += `\n[Message History]:\n`;
    messages.forEach((m, idx) => {
      fileText += `  #${idx + 1} [${m.role.toUpperCase()}]${m.name ? ` (${m.name})` : ''}: ${m.content}\n`;
      if (m.tool_calls) {
        fileText += `       Tool Calls: ${JSON.stringify(m.tool_calls)}\n`;
      }
    });
    fileText += `${divider}\n`;
    appendToFile(fileText);

    // 2. Write to Colorized Console
    console.log(`\n${colors.cyan}${colors.bold}${divider}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}[${timestamp}] 🤖 Agent Session Started (${provider} | ${model})${colors.reset}`);
    console.log(`${colors.yellow}${colors.bold}[System Prompt]:${colors.reset} ${colors.dim}${systemPrompt.substring(0, 150)}...${colors.reset}`);
    console.log(`${colors.blue}${colors.bold}[Input History]:${colors.reset}`);
    messages.forEach((m, idx) => {
      console.log(`  ${colors.dim}#${idx + 1}${colors.reset} [${colors.blue}${m.role.toUpperCase()}${colors.reset}]: ${m.content.substring(0, 120)}${m.content.length > 120 ? '...' : ''}`);
    });
    console.log(`${colors.cyan}${colors.bold}${'-'.repeat(80)}${colors.reset}`);
  },

  logToolCall(name: string, args: any) {
    const timestamp = new Date().toISOString();
    const argsStr = JSON.stringify(args, null, 2);
    
    // 1. Write to File
    let fileText = `[${timestamp}] 🔨 [TOOL CALL] ${name}\n`;
    fileText += `Arguments:\n${argsStr}\n`;
    fileText += `-`.repeat(80);
    appendToFile(fileText);

    // 2. Write to Colorized Console
    console.log(`${colors.green}${colors.bold}[${timestamp}] 🔨 [TOOL CALL] ${name}${colors.reset}`);
    console.log(`${colors.green}Arguments:${colors.reset} ${colors.dim}${JSON.stringify(args)}${colors.reset}`);
  },

  logToolResult(name: string, result: any) {
    const timestamp = new Date().toISOString();
    const resultStr = JSON.stringify(result, null, 2);
    const isError = !!result?.error;

    // 1. Write to File
    let fileText = `[${timestamp}] 🟢 [TOOL RESULT] ${name} (${isError ? 'FAILED' : 'SUCCESS'})\n`;
    fileText += `Result:\n${resultStr}\n`;
    fileText += `-`.repeat(80);
    appendToFile(fileText);

    // 2. Write to Colorized Console
    const statusColor = isError ? colors.red : colors.green;
    console.log(`${statusColor}${colors.bold}[${timestamp}] 🟢 [TOOL RESULT] ${name} [${isError ? 'FAILED' : 'SUCCESS'}]${colors.reset}`);
    const preview = JSON.stringify(result);
    console.log(`${colors.dim}Result: ${preview.substring(0, 200)}${preview.length > 200 ? '...' : ''}${colors.reset}`);
  },

  logAssistantResponse(content: string) {
    const timestamp = new Date().toISOString();
    
    // 1. Write to File
    let fileText = `[${timestamp}] 💬 [ASSISTANT RESPONSE]\n${content}\n`;
    fileText += `=`.repeat(80);
    appendToFile(fileText);

    // 2. Write to Colorized Console
    console.log(`${colors.cyan}${colors.bold}[${timestamp}] 💬 [ASSISTANT RESPONSE]${colors.reset}`);
    console.log(`${colors.cyan}${content}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}${'='.repeat(80)}${colors.reset}\n`);
  },

  logError(err: Error | string) {
    const timestamp = new Date().toISOString();
    const errMsg = err instanceof Error ? err.stack || err.message : err;
    
    // 1. Write to File
    let fileText = `[${timestamp}] 🚨 [AGENT LOOP ERROR]\n${errMsg}\n`;
    fileText += `=`.repeat(80);
    appendToFile(fileText);

    // 2. Write to Colorized Console
    console.error(`\n${colors.red}${colors.bold}[${timestamp}] 🚨 [AGENT LOOP ERROR]${colors.reset}`);
    console.error(`${colors.red}${errMsg}${colors.reset}\n`);
  }
};
