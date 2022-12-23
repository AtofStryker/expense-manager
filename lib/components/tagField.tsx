import { TextField, Autocomplete } from '@mui/material'
import { createFilterOptions } from '@mui/material/Autocomplete'
import { omit } from '@siegrift/tsfunct'
import difference from 'lodash/difference'
import { useSelector } from 'react-redux'
import { makeStyles } from 'tss-react/mui'
import { v4 as uuid } from 'uuid'

import { Tag } from '../addTransaction/state'
import { currentUserIdSel } from '../shared/selectors'
import { ObjectOf } from '../types'

const useStyles = makeStyles()({
  root: {
    width: '100%',
  },
})

interface TagFieldTag extends Tag {
  createdByTagField?: true
}

export interface TagFieldProps {
  tags: ObjectOf<Tag>
  className?: string
  inputValue: string
  currentTagIds: string[]
  onSelectTag: (tagId: string) => void
  onCreateTag: (tag: Tag) => void
  onSetTagInputValue: (tagName: string) => void
  onRemoveTags: (tagIds: string[]) => void
}

const filterOptions = createFilterOptions<TagFieldTag>()
const ADD_NEW_OPTION_LABEL = 'Create new: '

const TagField = ({
  tags,
  className,
  inputValue,
  currentTagIds,
  onSelectTag,
  onCreateTag,
  onSetTagInputValue,
  onRemoveTags,
}: TagFieldProps) => {
  const { classes, cx } = useStyles()
  const userId = useSelector(currentUserIdSel)

  return (
    <div className={cx(classes.root, className)} data-cy="tag-field-wrapper">
      <Autocomplete<TagFieldTag, true, true, true>
        multiple
        size="small"
        autoComplete
        freeSolo
        clearOnEscape
        autoHighlight
        options={Object.values(tags)}
        getOptionLabel={(option) => {
          return typeof option === 'string' ? option : option.name
        }}
        renderInput={(params) => {
          return <TextField {...params} variant="outlined" label="Transaction tags" fullWidth />
        }}
        filterOptions={(options, params) => {
          const filtered = filterOptions(options, params)
          if (!filtered.find((option) => params.getOptionLabel(option) === params.inputValue) && userId) {
            const id = uuid()
            filtered.push({
              name: `${ADD_NEW_OPTION_LABEL}${params.inputValue}`,
              automatic: false,
              id,
              uid: userId,
              createdByTagField: true,
            })
          }
          return filtered
        }}
        includeInputInList
        filterSelectedOptions={false}
        onChange={(_, values) => {
          if (currentTagIds.length < values.length) {
            const added = values[values.length - 1]
            if (typeof added === 'string') throw new Error('This should not happen!')
            if (added.createdByTagField) {
              onCreateTag({
                ...omit(added, ['createdByTagField']),
                name: added.name.split(ADD_NEW_OPTION_LABEL)[1],
              })
            } else {
              onSelectTag(added.id)
            }
          } else {
            const removed = difference(
              currentTagIds,
              values.map((v) => (v as Tag).id)
            )
            if (removed.length) onRemoveTags(removed)
          }
        }}
        onInputChange={(event, value) => {
          // NOTE: for some reason this callback fires with null event and resets input value
          if (event != null) onSetTagInputValue(value)
        }}
        inputValue={inputValue}
        value={currentTagIds.map((t) => tags[t])}
      />
    </div>
  )
}

export default TagField
