import { lazy, Suspense, useState } from 'react'

import { css } from '@emotion/react'
import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import RemoveIcon from '@mui/icons-material/Remove'
import { FormControl, Input, InputAdornment, InputLabel, useTheme, Tooltip } from '@mui/material'
import { FaCalculator as CalculatorIcon } from 'react-icons/fa'
import { NumericFormat } from 'react-number-format'

import { CurrencyValue } from '../shared/currencies'

const CalculatorDialog = lazy(() => import('./calculatorDialog'))
const CALC_OPEN_TRIGGERERS = ['+', '-', '*', '/']

interface AmountFieldProps {
  shouldValidateAmount: boolean
  isValidAmount: (amount: string) => boolean
  value: string
  onChange: (amount: string) => void
  label: string
  className?: string
  currency: CurrencyValue
  onPressEnter: (e: React.SyntheticEvent) => void
  // TODO: Basic amount component should not care about this, extract these
  type?: 'income' | 'expense' | 'transfer'
  setTransactionType?: (type: 'income' | 'expense' | 'transfer') => void
}

interface MuiInputProps {
  clearAmount: () => void
  openCalculator: () => void
  value: string
  placeholder: string
  // TODO: Basic amount component should not care about this, extract these
  transactionType?: 'income' | 'expense' | 'transfer'
}

const amountFieldId = 'amount-field'

const MuiInput: React.FC<MuiInputProps> = ({ clearAmount, openCalculator, transactionType, value, ...others }) => {
  const theme = useTheme()

  return (
    <Input
      {...others}
      // We don't want the input mode to be "numeric" because it does not support fractional units
      inputProps={{ inputMode: 'decimal' }}
      id={amountFieldId}
      value={value}
      startAdornment={
        transactionType === 'expense' ? (
          <RemoveIcon
            css={css`
              color: red;
            `}
          />
        ) : transactionType === 'income' ? (
          <AddIcon
            css={css`
              color: green;
            `}
          />
        ) : transactionType === 'transfer' ? (
          <CompareArrowsIcon
            css={css`
              color: burlywood;
            `}
          />
        ) : null
      }
      endAdornment={
        <InputAdornment position="end">
          <>
            <Tooltip title="Clear amount">
              <CancelIcon
                color="primary"
                onClick={clearAmount}
                css={css`
                  visibility: ${value ? 'visible' : 'hidden'};
                  margin-right: 3px;
                  margin-bottom: 2px;
                  cursor: pointer;
                `}
              />
            </Tooltip>
            <Tooltip
              title="Open calculator"
              css={css`
                cursor: pointer;
              `}
            >
              <span>
                <CalculatorIcon
                  color={theme.palette.primary.main}
                  size={20}
                  onClick={openCalculator}
                  css={css`
                    margin-bottom: -2px;
                  `}
                />
              </span>
            </Tooltip>
          </>
        </InputAdornment>
      }
      autoComplete="off"
    />
  )
}

const AmountField = ({
  isValidAmount,
  shouldValidateAmount,
  value,
  onChange,
  label,
  className,
  currency,
  onPressEnter,
  type,
  setTransactionType,
}: AmountFieldProps) => {
  const [showCalc, setShowCalc] = useState(false)
  const [calcExpression, setCalcExpression] = useState('')

  return (
    <>
      {showCalc && (
        <Suspense fallback={null}>
          <CalculatorDialog
            calcExpression={calcExpression}
            setCalcExpression={setCalcExpression}
            showCalc={showCalc}
            setShowCalc={setShowCalc}
            setAmount={onChange}
          />
        </Suspense>
      )}
      <FormControl
        aria-label="amount"
        error={shouldValidateAmount && !isValidAmount(value)}
        className={className}
        css={css`
          flex: 1;
        `}
      >
        <InputLabel htmlFor={amountFieldId}>{label}</InputLabel>
        <NumericFormat
          prefix={`${currency.symbol} `}
          thousandSeparator=","
          decimalScale={currency.scale}
          allowNegative={false}
          value={value}
          valueIsNumericString={true}
          placeholder={`${currency.symbol} 0.00`}
          customInput={MuiInput}
          onValueChange={(values) => {
            if (values.value !== value) onChange(values.value)
          }}
          clearAmount={() => onChange('')}
          openCalculator={() => {
            setCalcExpression(value)
            setShowCalc(true)
          }}
          // https://codepen.io/ashconnolly/pen/WyWgPG
          onInput={(e) => {
            const native = e.nativeEvent as InputEvent
            const key = native.data!

            // If there is no value, the plus sign is likely to reflect the sign of the amount of the transaction
            if (!value && setTransactionType) {
              if (key === '+') return setTransactionType('income')
              if (key === '-') return setTransactionType('expense')
            }

            if (CALC_OPEN_TRIGGERERS.includes(key)) {
              setCalcExpression((expr) => {
                if (CALC_OPEN_TRIGGERERS.includes(expr[expr.length - 1])) {
                  return value
                } else {
                  return value + key
                }
              })
              setShowCalc(true)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onPressEnter(e)
          }}
          transactionType={type}
        />
      </FormControl>
    </>
  )
}

export default AmountField
