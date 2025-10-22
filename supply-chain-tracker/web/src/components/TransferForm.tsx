export type TransferFormProps = {
  tokenId: number
  parentId: number
  balance: number
}

/**
 * TransferForm (scaffold)
 * Minimal component for TDD RED phase. Props are defined but not used yet.
 * The full form UI (destination, amount, submit) will be implemented in GREEN steps.
 */
export default function TransferForm(_props: TransferFormProps) {
  return <div data-testid="transfer-form">TransferForm</div>
}
