import type { Config } from 'tailwindcss'
import baseConfig from '@spotify2lidarr/config/tailwind/base.config'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  ...baseConfig,
}

export default config
