// src/application/pilot/commands/index.ts

export {
  MakePilotProductCreationCommand,
  type PilotProductCreationCommand,
  type UnvalidatedProductData,
} from './create-pilot-product.command'

export {
  MakePilotProductUpdateCommand,
  type PilotProductUpdateCommand,
  type UnvalidatedUpdateData,
} from './update-pilot-product.command'
