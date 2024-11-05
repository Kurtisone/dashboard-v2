import { FC, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { useRouter } from 'next/router'

import {
  Combobox,
  Grid,
  Group,
  InputBase,
  Pagination,
  useCombobox,
} from '@mantine/core'

import FullyRentedAPRDisclaimer from 'src/components/commons/others/FullyRentedAPRDisclaimer'
import { selectUserIncludesOtherAssets } from 'src/store/features/settings/settingsSelector'
import {
  OtherRealtoken,
  UserRealtoken,
} from 'src/store/features/wallets/walletsSelector'

import { AssetCard } from '../../cards'

export const AssetGrid: FC<{
  realtokens: (UserRealtoken | OtherRealtoken)[]
}> = (props) => {
  const router = useRouter()
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)

  function onPageChange(page: number) {
    setPage(page)
    // Scroll to top of grid
    document.getElementsByClassName('asset-grid')[0]?.scrollIntoView()
  }

  const paginationOffers: (UserRealtoken | OtherRealtoken)[] = useMemo(() => {
    if (pageSize === Infinity) return props.realtokens
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return props.realtokens.slice(start, end)
  }, [props.realtokens, page, pageSize])

  // Go to first page when data changes (e.g. search, filter, order, ...)
  useEffect(() => setPage(1), [props.realtokens, pageSize])

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const values = [20, 40, 100, 200]

  const options = [
    <Combobox.Option value={'All'} key={'All'}>
      {'All'}
    </Combobox.Option>,
    ...values.map((item) => (
      <Combobox.Option value={item.toString()} key={item}>
        {item}
      </Combobox.Option>
    )),
  ]
  const showOtherAssets = useSelector(selectUserIncludesOtherAssets)

  return (
    <>
      <Grid className={'asset-grid'}>
        {paginationOffers.map((item) => {
          const isAProperty = item.hasOwnProperty('rentStatus')
          if (!isAProperty) {
            if (!showOtherAssets) {
              return null
            }
            return (
              <Grid.Col key={item.id} span={{ base: 12, sm: 6, lg: 4, xl: 3 }}>
                <AssetCard
                  value={item as OtherRealtoken}
                  onClick={(id) => router.push(`/asset/${id}`)}
                />
              </Grid.Col>
            )
          }
          return (
            <Grid.Col key={item.id} span={{ base: 12, sm: 6, lg: 4, xl: 3 }}>
              <AssetCard
                value={item as UserRealtoken}
                onClick={(id) => router.push(`/asset/${id}`)}
              />
            </Grid.Col>
          )
        })}
      </Grid>
      <Group
        justify={'center'}
        align={'center'}
        gap={8}
        p={'xs'}
        style={{ width: '100%' }}
      >
        <Pagination
          value={page}
          total={
            pageSize === Infinity
              ? 0
              : Math.ceil(props.realtokens.length / pageSize)
          }
          boundaries={1}
          siblings={1}
          size={'sm'}
          onChange={onPageChange}
        />
        <Combobox
          store={combobox}
          withinPortal={false}
          onOptionSubmit={(val) => {
            if (val === 'All') return setPageSize(Infinity)
            setPageSize(Number(val))

            combobox.closeDropdown()
          }}
        >
          <Combobox.Target>
            <InputBase
              rightSection={<Combobox.Chevron />}
              value={pageSize == Infinity ? 'All' : pageSize}
              type={'button'}
              onChange={() => {
                combobox.openDropdown()
                combobox.updateSelectedOptionIndex()
              }}
              onClick={() => combobox.openDropdown()}
              onFocus={() => combobox.openDropdown()}
              onBlur={() => {
                combobox.closeDropdown()
              }}
              placeholder={'Search value'}
              rightSectionPointerEvents={'none'}
            />
          </Combobox.Target>

          <Combobox.Dropdown>
            <Combobox.Options>{options}</Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
        <FullyRentedAPRDisclaimer />
      </Group>
    </>
  )
}
