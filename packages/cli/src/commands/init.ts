import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stringify as stringifyToml } from '@iarna/toml';
import { defineCommand } from 'citty';
import { dump as stringifyYaml } from 'js-yaml';
import { ExitCode, TypsumeError } from '../errors.ts';
import type { SourceFormat } from '../format.ts';
import { logger } from '../logger.ts';
import { ensureProjectRuntime } from '../project.ts';

const SAMPLE_RESUME = {
  schema: 'typst-resume/1.0',
  basics: {
    name: '你的名字',
    title: 'Software Engineer',
    contacts: [
      { icon: 'envelope', text: 'name@example.com' },
      { icon: 'phone', text: '+86 138-0000-0000' },
    ],
  },
  skills: [
    {
      name: '前端',
      items: [
        { name: 'TypeScript', level: '精通' },
        { name: 'React', level: '熟悉' },
      ],
    },
  ],
  education: [
    {
      title: '某大学',
      subtitle: '计算机科学与技术 本科',
      period: '2019.09 – 2023.06',
      highlights: ['GPA 3.8/4.0', '优秀毕业生'],
    },
  ],
  experience: [
    {
      title: '某科技有限公司',
      subtitle: '前端开发实习生',
      department: '示例业务线',
      period: '2022.06 – 2022.09',
      highlights: ['负责某某项目前端开发', '使用 React + TypeScript 重构核心模块'],
    },
  ],
  projects: [
    {
      title: 'typsume',
      subtitle: '个人项目',
      period: '2024.01 – 至今',
      stack: ['TypeScript', 'Typst', 'Bun'],
      highlights: ['结构化数据驱动 Typst 简历编译', '支持 CLI + Web 双端'],
    },
  ],
  awards: [{ title: '某某竞赛一等奖', date: '2022', level: '校级' }],
};

const SAMPLE_CONFIG = `# typsume.config.toml
template = "default"
output  = "resume.pdf"

[build]
strict = false
`;

const SOURCE_FILENAMES: Record<SourceFormat, string> = {
  json: 'resume.json',
  yaml: 'resume.yaml',
  toml: 'resume.toml',
};

function parseInitFormat(value: string): SourceFormat {
  if (value === 'json' || value === 'yaml' || value === 'toml') return value;
  throw new TypsumeError(
    `Unsupported init format: ${value}. Expected json, yaml, or toml.`,
    ExitCode.general,
  );
}

function serializeSample(format: SourceFormat): string {
  switch (format) {
    case 'json':
      return `${JSON.stringify(SAMPLE_RESUME, null, 2)}\n`;
    case 'yaml':
      return stringifyYaml(SAMPLE_RESUME, { noRefs: true, lineWidth: 100 });
    case 'toml':
      return stringifyToml(SAMPLE_RESUME);
  }
}

export default defineCommand({
  meta: { name: 'init', description: 'Scaffold a minimal resume project' },
  args: {
    dir: {
      type: 'positional',
      default: '.',
      description: 'Target directory',
    },
    format: {
      type: 'string',
      default: 'toml',
      description: 'Resume source format: json, yaml, or toml',
    },
  },
  run({ args }) {
    const format = parseInitFormat(args.format);
    const { targetDir, resumePath, configPath } = initProject(args.dir, process.cwd(), format);

    logger.success(`Scaffolded resume project in ${targetDir}`);
    logger.info(resumePath);
    logger.info(configPath);
    logger.info(`Run: typsume build ${SOURCE_FILENAMES[format]}`);
  },
});

export function initProject(directory: string, cwd = process.cwd(), format: SourceFormat = 'toml') {
  const targetDir = resolve(cwd, directory);
  mkdirSync(targetDir, { recursive: true });
  ensureProjectRuntime(targetDir);

  const resumePath = resolve(targetDir, SOURCE_FILENAMES[format]);
  if (!existsSync(resumePath)) {
    writeFileSync(resumePath, serializeSample(format), 'utf-8');
  }

  const configPath = resolve(targetDir, 'typsume.config.toml');
  if (!existsSync(configPath)) writeFileSync(configPath, SAMPLE_CONFIG, 'utf-8');
  return { targetDir, resumePath, configPath };
}
