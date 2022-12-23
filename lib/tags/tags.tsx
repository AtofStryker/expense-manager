import AddIcon from '@mui/icons-material/Add'
import { Theme, Button, Link, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { makeStyles } from 'tss-react/mui'

import PageWrapper from '../components/pageWrapper'
import Paper from '../components/paper'

import { tagsSel } from './selectors'
import TagItem from './tagItem'

const useStyles = makeStyles()((theme: Theme) => ({
  noTagsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
  },
  noTransactions: { textAlign: 'center' },
  createTag: {
    marginTop: theme.spacing(2),
  },
}))

const Tags = () => {
  const tagsLength = Object.values(useSelector(tagsSel)).length
  const { classes } = useStyles()

  return (
    <PageWrapper>
      <Paper listContainer>
        {tagsLength === 0 ? (
          <div className={classes.noTagsWrapper}>
            <Typography variant="overline" display="block" gutterBottom className={classes.noTransactions}>
              You have no tags...
            </Typography>
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => {
              return (
                <FixedSizeList height={height} width={width} itemSize={60} itemCount={tagsLength}>
                  {TagItem}
                </FixedSizeList>
              )
            }}
          </AutoSizer>
        )}
      </Paper>

      <Link href="/tags/create">
        <Button
          fullWidth
          variant="contained"
          color="primary"
          aria-label="create tag"
          className={classes.createTag}
          startIcon={<AddIcon />}
        >
          Create new tag
        </Button>
      </Link>
    </PageWrapper>
  )
}

export default Tags
