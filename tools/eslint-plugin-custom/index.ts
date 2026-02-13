import { lineBeforePipe } from './rules/line-before-pipe.ts'
import { noNamespaceImportEffect } from './rules/no-namespace-import-effect.ts'

export default {
  rules: {
    'line-before-pipe': lineBeforePipe,
    'no-namespace-import-effect': noNamespaceImportEffect,
  },
}
