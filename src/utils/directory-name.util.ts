import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const getCurrentDir = (metaUrl: string) => dirname(fileURLToPath(metaUrl));

export default getCurrentDir;
