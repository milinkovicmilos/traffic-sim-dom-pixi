import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function getCodeVersion(): string {
    try {
        return execSync('git describe --tags --always --dirty', { encoding: 'utf8' }).trim();
    } catch {
        return 'unknown';
    }
}

export default defineConfig({
    base: 'traffic-sim-dom-pixi',
    define: {
        __CODE_VERSION__: JSON.stringify(getCodeVersion()),
    },
    resolve: {
        tsconfigPaths: true,
    },
});
