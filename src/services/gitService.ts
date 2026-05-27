import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import type { FileChangeStatus, ModifiedFile } from '../shared/types';

const execFileAsync = promisify(execFile);

const STATUS_MAP: Record<string, FileChangeStatus> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
};

export class GitService {
  constructor(private readonly workspaceRoot: string) {}

  async listModifiedFiles(): Promise<ModifiedFile[]> {
    const output = await this.runGit(['status', '--porcelain', '-u']);
    if (!output.trim()) {
      return [];
    }

    return output
      .split('\n')
      .filter(Boolean)
      .map((line) => this.parseStatusLine(line))
      .filter((file): file is ModifiedFile => file !== null);
  }

  async getDiff(filePath: string, status: FileChangeStatus): Promise<string> {
    const relativePath = path.relative(this.workspaceRoot, filePath);

    if (status === 'added') {
      try {
        const content = await this.runGit(['show', `:${relativePath}`]);
        return `--- /dev/null\n+++ b/${relativePath}\n${this.toUnifiedDiffLines(content)}`;
      } catch {
        return await this.runGit(['diff', '--no-index', '/dev/null', relativePath]).catch(
          () => '(new file, diff unavailable)',
        );
      }
    }

    if (status === 'deleted') {
      return await this.runGit(['diff', '--', relativePath]).catch(() => '(deleted file)');
    }

    return await this.runGit(['diff', '--', relativePath]).catch(
      () => '(diff unavailable)',
    );
  }

  private parseStatusLine(line: string): ModifiedFile | null {
    const indexStatus = line[0] ?? ' ';
    const workTreeStatus = line[1] ?? ' ';
    const statusChar = workTreeStatus !== ' ' && workTreeStatus !== '?' ? workTreeStatus : indexStatus;

    if (statusChar === '?' || statusChar === '!') {
      const untrackedPath = line.slice(3).trim();
      return {
        path: path.join(this.workspaceRoot, untrackedPath),
        status: 'added',
        selected: true,
      };
    }

    const mapped = STATUS_MAP[statusChar];
    if (!mapped) {
      return null;
    }

    let fileSegment = line.slice(3).trim();
    if (mapped === 'renamed' || mapped === 'copied') {
      const arrowIndex = fileSegment.indexOf(' -> ');
      if (arrowIndex !== -1) {
        fileSegment = fileSegment.slice(arrowIndex + 4);
      }
    }

    return {
      path: path.join(this.workspaceRoot, fileSegment),
      status: mapped,
      selected: true,
    };
  }

  private toUnifiedDiffLines(content: string): string {
    const lines = content.split('\n');
    return lines.map((line) => `+${line}`).join('\n');
  }

  private async runGit(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync('git', args, {
      cwd: this.workspaceRoot,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  }
}
