import { FC, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Button,
  Flex,
  Modal,
  Stack,
  TextInput,
  createStyles,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { ContextModalProps } from '@mantine/modals'

import { utils as EthersUtils } from 'ethers'

import { useAppDispatch } from 'src/hooks/react-hooks'
import { selectUser } from 'src/store/features/settings/settingsSelector'
import {
  setCustomAddressList,
  setHiddenAddressList,
} from 'src/store/features/settings/settingsSlice'

const AddAddressButton: FC<{
  onChange: (value: string) => void
  addresses: string[]
}> = (props) => {
  const { t } = useTranslation('common', { keyPrefix: 'addCustomAddress' })

  const [opened, { open, close }] = useDisclosure(false)
  const [address, setAddress] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const isInvalidAddress = !EthersUtils.isAddress(address)
  const isAddressAlreadyAdded = props.addresses
    .map((address) => address.toLowerCase())
    .includes(address.toLowerCase())

  const currentError = isInvalidAddress
    ? t('invalidAddress')
    : isAddressAlreadyAdded
    ? t('addressAlreadyAdded')
    : undefined

  function resetAndClose() {
    setAddress('')
    setIsDirty(false)
    close()
  }

  function submit() {
    if (currentError) {
      return setIsDirty(true)
    }
    props.onChange(address)
    resetAndClose()
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={t('title')}
        zIndex={300}
        centered={true}
        withCloseButton={false}
      >
        <TextInput
          style={{ width: '100%' }}
          size={'xs'}
          mt={'xs'}
          value={address}
          error={currentError && isDirty ? currentError : undefined}
          onChange={(event) => setAddress(event.currentTarget.value)}
        />

        <Flex justify={'flex-end'} gap={'sm'} mt={'lg'}>
          <Button onClick={resetAndClose} variant={'subtle'}>
            {t('close')}
          </Button>
          <Button onClick={submit}>{t('submit')}</Button>
        </Flex>
      </Modal>

      <Button onClick={open} size={'xs'} variant={'outline'}>
        {t('open')}
      </Button>
    </>
  )
}
AddAddressButton.displayName = 'AddAddressButton'

const useStyles = createStyles({
  address: {
    border: '1px solid rgb(92, 95, 102)',
    borderRadius: '10px',
    fontFamily: 'monospace',
    fontSize: '13px',
    display: 'inline-block',
    padding: '4px 8px',
    maxWidth: '100%',
    overflowWrap: 'break-word',
  },
})

const WalletItem: FC<{
  address: string
  isVisible: boolean
  onToggle: (address: string) => void
  onRemove?: (address: string) => void
}> = (props) => {
  const { classes } = useStyles()
  const { t } = useTranslation('common', {
    keyPrefix: 'manageWalletModal.item',
  })

  const address = EthersUtils.getAddress(props.address)

  return (
    <div
      className={classes.address}
      style={{
        opacity: props.isVisible ? 1 : 0.5,
        transition: 'opacity 0.2s',
      }}
    >
      <div>{address}</div>
      <Flex
        gap={'sm'}
        justify={'space-between'}
        direction={'row-reverse'}
        mt={'3px'}
        mb={'2px'}
      >
        <Button
          onClick={() => props.onToggle(props.address)}
          size={'xs'}
          compact={true}
          variant={'outline'}
        >
          {props.isVisible ? t('hide') : t('show')}
        </Button>
        {props.onRemove ? (
          <Button
            onClick={() => props.onRemove?.(props.address)}
            size={'xs'}
            compact={true}
            variant={'outline'}
            color={'red'}
          >
            {t('remove')}
          </Button>
        ) : undefined}
      </Flex>
    </div>
  )
}
WalletItem.displayName = 'WalletItem'

export const ManageWalletModal: FC<ContextModalProps> = ({ context, id }) => {
  const { t } = useTranslation('common', { keyPrefix: 'manageWalletModal' })
  const dispatch = useAppDispatch()

  const onClose = useCallback(() => {
    context.closeModal(id)
  }, [context, id])

  const user = useSelector(selectUser)
  const [customAddresses, setCustomAddresses] = useState(
    user?.customAddressList ?? []
  )
  const [hiddenAddresses, setHiddenAddresses] = useState(
    user?.hiddenAddressList ?? []
  )

  const addresses = [...(user?.addressList ?? []), ...(customAddresses ?? [])]

  function addAddress(address: string) {
    setCustomAddresses([...customAddresses, address])
  }

  function removeAddress(address: string) {
    setCustomAddresses(customAddresses.filter((item) => item !== address))
  }

  function toggleAddressVisibility(address: string) {
    if (hiddenAddresses.includes(address)) {
      setHiddenAddresses(hiddenAddresses.filter((item) => item !== address))
    } else {
      setHiddenAddresses([...hiddenAddresses, address])
    }
  }

  const onSubmit = async () => {
    dispatch(setCustomAddressList(customAddresses))
    dispatch(setHiddenAddressList(hiddenAddresses))
    onClose()
  }

  return (
    <Stack
      justify={'space-between'}
      style={{ width: '500px', maxWidth: '100%', padding: 'none' }}
    >
      <Flex direction={'column'} gap={'xs'} align={'center'}>
        <div style={{ margin: '5px 0' }}>{t('open')}</div>
        {user?.addressList.map((address) => (
          <WalletItem
            key={address}
            address={address}
            isVisible={!hiddenAddresses.includes(address)}
            onToggle={toggleAddressVisibility}
          />
        ))}
        {customAddresses.map((address) => (
          <WalletItem
            key={address}
            address={address}
            isVisible={!hiddenAddresses.includes(address)}
            onRemove={removeAddress}
            onToggle={toggleAddressVisibility}
          />
        ))}
        <AddAddressButton onChange={addAddress} addresses={addresses} />
      </Flex>

      <Flex justify={'space-between'}>
        <div />
        <div>
          <Flex gap={'sm'}>
            <Button onClick={onClose} variant={'subtle'}>
              {t('close')}
            </Button>
            <Button onClick={onSubmit}>{t('submit')}</Button>
          </Flex>
        </div>
      </Flex>
    </Stack>
  )
}
