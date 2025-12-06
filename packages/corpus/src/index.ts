// surmiser-corpus - Local predictive provider
export { localPredictive } from './provider'
export { defaultCorpus } from './default-corpus'
export * from './tokenizer'

// Pre-made provider with default corpus
import { localPredictive } from './provider'
export const defaultProvider = localPredictive()
