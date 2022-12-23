import { Button, Dialog, DialogActions, DialogContent, TextField } from '@mui/material'
import { create as createMath, all as allMathFunctions } from 'mathjs'

import { round } from '../shared/utils'

const math = createMath(allMathFunctions)

interface CalculatorDialogProps {
  setShowCalc: (open: boolean) => void
  showCalc: boolean
  calcExpression: string
  setCalcExpression: (exp: string) => void
  setAmount: (amount: string) => void
}

const CalculatorDialog = ({
  calcExpression,
  setCalcExpression,
  setShowCalc,
  showCalc,
  setAmount,
}: CalculatorDialogProps) => {
  let exprResult: number | null
  try {
    exprResult = math.evaluate(calcExpression)
  } catch {
    exprResult = null
  }

  const onOk = () => {
    setAmount('' + (exprResult || ''))
    setShowCalc(false)
  }

  return (
    <Dialog
      onClose={() => setShowCalc(false)}
      aria-labelledby="simple-dialog-title"
      disableEnforceFocus
      TransitionProps={{
        onEntered: () => document.getElementById('calculator-textfield')?.focus(),
      }}
      open={showCalc}
    >
      <DialogContent>
        <TextField
          id="calculator-textfield"
          autoFocus
          inputProps={{ inputMode: 'numeric' }}
          fullWidth
          error={exprResult === null}
          label="Expression"
          value={calcExpression}
          onChange={(e) => setCalcExpression(e.target.value)}
          // TODO: Round based on the decimal points of a currency
          helperText={exprResult === null ? 'Malformed expression' : `Result: ${round(exprResult, 2) || ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onOk()
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCalc(false)} color="primary">
          Cancel
        </Button>
        <Button onClick={onOk} color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalculatorDialog
