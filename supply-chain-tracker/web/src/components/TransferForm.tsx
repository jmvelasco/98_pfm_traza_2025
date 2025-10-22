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
  return (
    <form data-testid="transfer-form" onSubmit={e => e.preventDefault()}>
      <div>
        <label htmlFor="destination">Destination</label>
        <input id="destination" name="destination" />
      </div>
      <div>
        <label htmlFor="amount">Amount</label>
        <input id="amount" name="amount" type="number" />
      </div>
      <button type="submit" disabled>
        Request Transfer
      </button>
    </form>
  )
}
