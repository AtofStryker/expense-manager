import { css } from '@emotion/react'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import Image from 'next/image'
import { makeStyles } from 'tss-react/mui'

import { CURRENCIES, Currency } from '../shared/currencies'

interface CurrencySelectProps {
  onChange: (value: Currency) => void
  value: Currency
  label?: string
  className?: string
}

const CurrencySelect = ({ value, onChange, label, className }: CurrencySelectProps) => {
  const { classes, cx } = useStyles()
  const currecyId = 'currency-select'

  return (
    <FormControl className={cx(className, classes.formControl)}>
      <InputLabel htmlFor={currecyId}>{label || 'Currency'}</InputLabel>
      <Select id={currecyId} value={value} onChange={(e) => onChange(e.target.value as Currency)}>
        {Object.keys(CURRENCIES).map((value) => (
          <MenuItem key={value} value={value}>
            <div
              css={css`
                display: flex;
                align-items: center;
              `}
            >
              <Image
                src={`/static/${value.toLowerCase()}.png`}
                width={24}
                height={18}
                css={css`
                  margin-right: 8px;
                `}
                alt="Currency icon"
              />
              <span
                css={css`
                  vertical-align: text-top;
                `}
              >
                {value}
              </span>
            </div>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

const useStyles = makeStyles({ name: { CurrencySelect } })({
  formControl: {
    justifyContent: 'end',
  },
})

export default CurrencySelect
