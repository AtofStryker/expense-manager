import React, { Suspense, useState } from 'react'

import FormControl from '@material-ui/core/FormControl'
import Input from '@material-ui/core/Input'
import InputAdornment from '@material-ui/core/InputAdornment'
import InputLabel from '@material-ui/core/InputLabel'
import { useTheme } from '@material-ui/core/styles'
import Tooltip from '@material-ui/core/Tooltip'
import AddIcon from '@material-ui/icons/Add'
import CancelIcon from '@material-ui/icons/Cancel'
import CompareArrowsIcon from '@material-ui/icons/CompareArrows'
import RemoveIcon from '@material-ui/icons/Remove'
import { FaCalculator as CalculatorIcon } from 'react-icons/fa'
import { NumericFormat } from 'react-number-format'

import { CurrencyValue } from '../shared/currencies'

const CalculatorDialog = React.lazy(() => import('./calculatorDialog'))
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
  type?: 'income' | 'expense' | 'transfer'
}

interface MuiInputProps {
  clearAmount: () => void
  openCalculator: () => void
  value: string
  transactionType?: 'income' | 'expense' | 'transfer'
  placeholder: string
}

const amountFieldId = 'amount-field'

const MuiInput: React.FC<MuiInputProps> = ({ clearAmount, openCalculator, transactionType, value, ...others }) => {
  const theme = useTheme()

  return (
    <Input
      {...others}
      inputProps={{ inputMode: 'numeric' }}
      id={amountFieldId}
      value={value}
      startAdornment={
        transactionType === 'expense' ? (
          <RemoveIcon style={{ color: 'red' }} />
        ) : transactionType === 'income' ? (
          <AddIcon style={{ color: 'green' }} />
        ) : transactionType === 'transfer' ? (
          <CompareArrowsIcon style={{ color: 'burlywood' }} />
        ) : null
      }
      endAdornment={
        <InputAdornment position="end">
          <>
            <Tooltip title="Clear amount">
              <CancelIcon
                color="primary"
                onClick={clearAmount}
                style={{
                  visibility: value ? 'visible' : 'hidden',
                  marginRight: 2,
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
            <Tooltip title="Open calculator" style={{ cursor: 'pointer' }}>
              <span>
                <CalculatorIcon color={theme.palette.primary.main} size={20} onClick={openCalculator} />
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
        style={{ flex: 1 }}
      >
        <InputLabel htmlFor={amountFieldId}>{label}</InputLabel>
        <NumericFormat
          prefix={`${currency.symbol} `}
          thousandSeparator=","
          decimalScale={currency.scale}
          fixedDecimalScale
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
