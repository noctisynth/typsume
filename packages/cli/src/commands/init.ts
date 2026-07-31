import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineCommand } from 'citty';
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

export default defineCommand({
  meta: { name: 'init', description: 'Scaffold a minimal resume project' },
  args: {
    dir: {
      type: 'positional',
      default: '.',
      description: 'Target directory',
    },
  },
  run({ args }) {
    const targetDir = resolve(process.cwd(), args.dir);
    mkdirSync(targetDir, { recursive: true });
    ensureProjectRuntime(targetDir);

    const resumePath = resolve(targetDir, 'resume.json');
    if (!existsSync(resumePath)) {
      writeFileSync(resumePath, `${JSON.stringify(SAMPLE_RESUME, null, 2)}\n`, 'utf-8');
    }

    const configPath = resolve(targetDir, 'typsume.config.toml');
    if (!existsSync(configPath)) {
      writeFileSync(configPath, SAMPLE_CONFIG, 'utf-8');
    }

    console.log(`OK: scaffolded resume project in ${targetDir}`);
    console.log(`  ${resumePath}`);
    console.log(`  ${configPath}`);
    console.log('Run: typsume build resume.json');
  },
});
