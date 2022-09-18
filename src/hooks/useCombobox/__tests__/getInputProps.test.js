import * as React from 'react'
import {act, renderHook} from '@testing-library/react-hooks'
import {fireEvent, createEvent} from '@testing-library/react'
import * as stateChangeTypes from '../stateChangeTypes'
import {noop} from '../../../utils'
import {
  renderUseCombobox,
  renderCombobox,
  items,
  defaultIds,
  changeInputValue,
  getInput,
  getItems,
  keyDownOnInput,
  mouseLeaveItemAtIndex,
  mouseMoveItemAtIndex,
  tab,
} from '../testUtils'
import utils from '../../utils'
import useCombobox from '..'

describe('getInputProps', () => {
  describe('hook props', () => {
    test('assign default value to id', () => {
      const {result} = renderUseCombobox()
      const inputProps = result.current.getInputProps()

      expect(inputProps.id).toEqual(defaultIds.inputId)
    })

    test('assign custom value passed by user to id', () => {
      const props = {
        inputId: 'my-custom-input-id',
      }
      const {result} = renderUseCombobox(props)
      const inputProps = result.current.getInputProps()

      expect(inputProps.id).toEqual(props.inputId)
    })

    test("assign 'list' to 'aria-autocomplete'", () => {
      const {result} = renderUseCombobox()
      const inputProps = result.current.getInputProps()

      expect(inputProps['aria-autocomplete']).toEqual('list')
    })

    test("assign 'off' to autoComplete", () => {
      const {result} = renderUseCombobox()
      const inputProps = result.current.getInputProps()

      expect(inputProps.autoComplete).toEqual('off')
    })

    test('assign default value to aria-controls', () => {
      const {result} = renderUseCombobox()
      const inputProps = result.current.getInputProps()

      expect(inputProps['aria-controls']).toEqual(`${defaultIds.menuId}`)
    })

    test('assign custom value passed by user to aria-controls', () => {
      const props = {
        menuId: 'my-custom-menu-id',
      }
      const {result} = renderUseCombobox(props)
      const inputProps = result.current.getInputProps()

      expect(inputProps['aria-controls']).toEqual(`${props.menuId}`)
    })

    test('assign id of highlighted item to aria-activedescendant if item is highlighted and menu is open', () => {
      const {result} = renderUseCombobox({highlightedIndex: 2, isOpen: true})
      const inputProps = result.current.getInputProps()

      expect(inputProps['aria-activedescendant']).toEqual(
        defaultIds.getItemId(2),
      )
    })

    test('assign no aria-activedescendant if item is highlighted and menu is closed', () => {
      const {result} = renderUseCombobox({highlightedIndex: 2})
      const inputProps = result.current.getInputProps()

      expect(inputProps['aria-activedescendant']).toBeUndefined()
    })

    test('do not assign aria-activedescendant if no item is highlighted', () => {
      const {result} = renderUseCombobox()
      const inputProps = result.current.getInputProps()

      expect(inputProps['aria-activedescendant']).toBeUndefined()
    })

    test('assign default value to aria-labelledby', () => {
      const {result} = renderUseCombobox()
      const inputProps = result.current.getInputProps()

      expect(inputProps['aria-labelledby']).toEqual(`${defaultIds.labelId}`)
    })

    test('assign custom value passed by user to aria-labelledby', () => {
      const props = {
        labelId: 'my-custom-label-id',
      }
      const {result} = renderUseCombobox(props)
      const inputProps = result.current.getInputProps()

      expect(inputProps['aria-labelledby']).toEqual(`${props.labelId}`)
    })

    test("handlers are not called if it's disabled", () => {
      const {result} = renderUseCombobox()
      const inputProps = result.current.getInputProps({
        disabled: true,
      })

      expect(inputProps.onChange).toBeUndefined()
      expect(inputProps.onKeyDown).toBeUndefined()
      expect(inputProps.onBlur).toBeUndefined()
      // eslint-disable-next-line jest-dom/prefer-enabled-disabled
      expect(inputProps.disabled).toBe(true)
    })
  })

  describe('user props', () => {
    test('are passed down', () => {
      const {result} = renderUseCombobox()

      expect(result.current.getInputProps({foo: 'bar'})).toHaveProperty(
        'foo',
        'bar',
      )
    })

    test('custom ref passed by the user is used', () => {
      const {result} = renderUseCombobox()
      const refFn = jest.fn()
      const inputNode = {}

      act(() => {
        const {ref} = result.current.getInputProps({ref: refFn})

        ref(inputNode)
      })

      expect(refFn).toHaveBeenCalledTimes(1)
      expect(refFn).toHaveBeenCalledWith(inputNode)
    })

    test('custom ref with custom name passed by the user is used', () => {
      const {result} = renderUseCombobox()
      const refFn = jest.fn()
      const inputNode = {}

      act(() => {
        const {blablaRef} = result.current.getInputProps({
          refKey: 'blablaRef',
          blablaRef: refFn,
        })

        blablaRef(inputNode)
      })

      expect(refFn).toHaveBeenCalledTimes(1)
      expect(refFn).toHaveBeenCalledWith(inputNode)
    })

    test('event handler onKeyDown is called along with downshift handler', () => {
      const userOnKeyDown = jest.fn()
      const {result} = renderUseCombobox()

      const {ref: inputRef, onKeyDown} = result.current.getInputProps({
        onKeyDown: userOnKeyDown,
      })
      inputRef({focus: noop})
      act(() => {
        result.current.toggleMenu()
      })
      act(() => {
        onKeyDown({key: 'Escape', preventDefault: noop, stopPropagation: noop})
      })

      expect(userOnKeyDown).toHaveBeenCalledTimes(1)
      expect(result.current.isOpen).toBe(false)
    })

    test("event handler onKeyDown is called without downshift handler if 'preventDownshiftDefault' is passed in user event", () => {
      const userOnKeyDown = jest.fn(event => {
        event.preventDownshiftDefault = true
      })
      const {result} = renderUseCombobox()

      act(() => {
        const {ref: inputRef, onKeyDown} = result.current.getInputProps({
          onKeyDown: userOnKeyDown,
        })

        inputRef({focus: noop})
        result.current.toggleMenu()
        onKeyDown({key: 'Escape', preventDefault: noop})
      })

      expect(userOnKeyDown).toHaveBeenCalledTimes(1)
      expect(result.current.isOpen).toBe(true)
    })

    test('event handler onBlur is called along with downshift handler', () => {
      const userOnBlur = jest.fn()
      const {result} = renderUseCombobox({initialIsOpen: true})

      act(() => {
        const {ref: inputRef, onBlur} = result.current.getInputProps({
          onBlur: userOnBlur,
        })

        inputRef({focus: noop})
        result.current.toggleMenu()
        onBlur({})
      })

      expect(userOnBlur).toHaveBeenCalledTimes(1)
      expect(result.current.isOpen).toBe(false)
    })

    test("event handler onBlur is called without downshift handler if 'preventDownshiftDefault' is passed in user event", () => {
      const userOnBlur = jest.fn(event => {
        event.preventDownshiftDefault = true
      })
      const {result} = renderUseCombobox()

      act(() => {
        const {ref: inputRef, onBlur} = result.current.getInputProps({
          onBlur: userOnBlur,
        })

        inputRef({focus: noop})
        result.current.toggleMenu()
        onBlur({preventDefault: noop})
      })

      expect(userOnBlur).toHaveBeenCalledTimes(1)
      expect(result.current.isOpen).toBe(true)
    })

    test('event handler onChange is called along with downshift handler', () => {
      const userOnChange = jest.fn()
      const {result} = renderUseCombobox()

      act(() => {
        const {ref: inputRef, onChange} = result.current.getInputProps({
          onChange: userOnChange,
        })

        inputRef({focus: noop})
        result.current.toggleMenu()
        onChange({target: {value: 'lalaland'}})
      })

      expect(userOnChange).toHaveBeenCalledTimes(1)
      expect(result.current.inputValue).toBe('lalaland')
    })

    test("event handler onChange is called without downshift handler if 'preventDownshiftDefault' is passed in user event", () => {
      const userOnChange = jest.fn(event => {
        event.preventDownshiftDefault = true
      })
      const {result} = renderUseCombobox()

      act(() => {
        const {ref: inputRef, onChange} = result.current.getInputProps({
          onChange: userOnChange,
        })

        inputRef({focus: noop})
        result.current.toggleMenu()
        onChange({target: {value: 'lalaland'}})
      })

      expect(userOnChange).toHaveBeenCalledTimes(1)
      expect(result.current.inputValue).toBe('')
    })

    test('event handler onInput is called along with downshift handler', () => {
      const userOnInput = jest.fn()
      const {result} = renderUseCombobox()

      act(() => {
        const {ref: inputRef, onChange} = result.current.getInputProps({
          onChange: userOnInput,
        })

        inputRef({focus: noop})
        result.current.toggleMenu()
        onChange({target: {value: 'a'}})
      })

      expect(userOnInput).toHaveBeenCalledTimes(1)
      expect(result.current.inputValue).toBe('a')
    })

    test("event handler onInput is called without downshift handler if 'preventDownshiftDefault' is passed in user event", () => {
      const userOnInput = jest.fn(event => {
        event.preventDownshiftDefault = true
      })
      const {result} = renderUseCombobox()

      act(() => {
        const {ref: inputRef, onChange} = result.current.getInputProps({
          onChange: userOnInput,
        })

        inputRef({focus: noop})
        result.current.toggleMenu()
        onChange({target: {value: 'a'}})
      })

      expect(userOnInput).toHaveBeenCalledTimes(1)
      expect(result.current.inputValue).toBe('')
    })
  })

  describe('initial focus', () => {
    test('is grabbed when isOpen is passed as true', () => {
      renderCombobox({isOpen: true})

      expect(getInput()).toHaveFocus()
    })

    test('is grabbed when initialIsOpen is passed as true', () => {
      renderCombobox({initialIsOpen: true})

      expect(getInput()).toHaveFocus()
    })

    test('is grabbed when defaultIsOpen is passed as true', () => {
      renderCombobox({defaultIsOpen: true})

      expect(getInput()).toHaveFocus()
    })

    test('is not grabbed when initial open is set to default (false)', () => {
      renderCombobox()

      expect(getInput()).not.toHaveFocus()
    })
  })

  describe('event handlers', () => {
    test('on change should open the menu and keep the input value', async () => {
      renderCombobox()

      await changeInputValue('california')

      expect(getItems()).toHaveLength(items.length)
      expect(getInput()).toHaveValue('california')
    })

    describe('on key down', () => {
      describe('arrow up', () => {
        test('it prevents the default event behavior', () => {
          renderCombobox()
          const input = getInput()
          const keyDownEvent = createEvent.keyDown(input, {key: 'ArrowUp'})

          fireEvent(input, keyDownEvent)

          expect(keyDownEvent.defaultPrevented).toBe(true)
        })

        test('it does not open or highlight anything if there are no options', async () => {
          renderCombobox({items: []})

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).not.toHaveAttribute('aria-activedescendant')
          expect(getItems()).toHaveLength(0)
        })

        test('it does not highlight anything if there are no options', async () => {
          renderCombobox({
            items: [],
            isOpen: true,
          })

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).not.toHaveAttribute('aria-activedescendant')
          expect(getItems()).toHaveLength(0)
        })

        test('it opens the menu and highlights the last option', async () => {
          renderCombobox()

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(items.length - 1),
          )
          expect(getItems()).toHaveLength(items.length)
        })

        test('it opens the closed menu with selected option highlighted', async () => {
          const selectedIndex = 4
          renderCombobox({
            initialSelectedItem: items[selectedIndex],
          })

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(selectedIndex),
          )
        })

        test('it opens the closed menu at initialHighlightedIndex, but on first arrow up only', async () => {
          const initialHighlightedIndex = 2
          renderCombobox({
            initialHighlightedIndex,
          })

          const input = getInput()

          await keyDownOnInput('{ArrowUp}')

          expect(input).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(initialHighlightedIndex),
          )

          await keyDownOnInput('{Escape}')
          await keyDownOnInput('{ArrowUp}')

          expect(input).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(items.length - 1),
          )
        })

        test('it opens the closed menu at defaultHighlightedIndex, on every arrow up', async () => {
          const defaultHighlightedIndex = 3
          renderCombobox({
            defaultHighlightedIndex,
          })
          const input = getInput()

          await keyDownOnInput('{ArrowUp}')

          expect(input).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(defaultHighlightedIndex),
          )

          await keyDownOnInput('{Escape}')
          await keyDownOnInput('{ArrowUp}')

          expect(input).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(defaultHighlightedIndex),
          )
        })

        test('it opens the closed menu and keeps focus on the combobox', async () => {
          renderCombobox()

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).toHaveFocus()
        })

        test('it highlights the last option number if none is highlighted', async () => {
          renderCombobox({isOpen: true})

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(items.length - 1),
          )
        })

        test('it highlights the previous item', async () => {
          const initialHighlightedIndex = 2
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex,
          })

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(initialHighlightedIndex - 1),
          )
        })

        test('with shift it highlights the 5th previous item', async () => {
          const initialHighlightedIndex = 6
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex,
          })

          await keyDownOnInput('{Shift>}{ArrowUp}{/Shift}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(initialHighlightedIndex - 5),
          )
        })

        test('with shift it highlights the last item if not enough items remaining', async () => {
          const initialHighlightedIndex = 1
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex,
          })

          await keyDownOnInput('{Shift>}{ArrowUp}{/Shift}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(items.length - 1),
          )
        })

        test('will stop at 0 if circularNavigatios is false', async () => {
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex: 0,
            circularNavigation: false,
          })

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(0),
          )
        })

        test('will continue from 0 to last item if circularNavigatios is default', async () => {
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex: 0,
          })

          await keyDownOnInput('{ArrowUp}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(items.length - 1),
          )
        })
      })

      describe('arrow down', () => {
        test('it prevents the default event behavior', () => {
          renderCombobox()
          const input = getInput()
          const keyDownEvent = createEvent.keyDown(input, {key: 'ArrowDown'})

          fireEvent(input, keyDownEvent)

          expect(keyDownEvent.defaultPrevented).toBe(true)
        })

        test('it does not opne on highlight anything if there are no options', async () => {
          renderCombobox({items: []})

          await keyDownOnInput('{ArrowDown}')

          expect(getInput()).not.toHaveAttribute('aria-activedescendant')
          expect(getItems()).toHaveLength(0)
        })

        test('it does not highlight anything if there are no options', async () => {
          renderCombobox({
            items: [],
            isOpen: true,
          })

          await keyDownOnInput('{ArrowDown}')

          expect(getInput()).not.toHaveAttribute('aria-activedescendant')
          expect(getItems()).toHaveLength(0)
        })

        test("it opens the menu and highlights option number '0'", async () => {
          renderCombobox()

          await keyDownOnInput('{ArrowDown}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(0),
          )
          expect(getItems()).toHaveLength(items.length)
        })

        test('opens the closed menu with selected option highlighted', async () => {
          const selectedIndex = 4
          renderCombobox({
            initialSelectedItem: items[selectedIndex],
          })

          await keyDownOnInput('{ArrowDown}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(selectedIndex),
          )
        })

        test('it opens the menu and highlights initialHighlightedIndex only once', async () => {
          const initialHighlightedIndex = 2
          renderCombobox({
            initialHighlightedIndex,
          })
          const input = getInput()

          await keyDownOnInput('{ArrowDown}')

          expect(input).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(initialHighlightedIndex),
          )
          expect(getItems()).toHaveLength(items.length)

          await keyDownOnInput('{Escape}')
          await keyDownOnInput('{ArrowDown}')

          expect(input).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(0),
          )
          expect(getItems()).toHaveLength(items.length)
        })

        test('it opens the menu and highlights defaultHighlightedIndex always', async () => {
          const defaultHighlightedIndex = 2
          renderCombobox({
            defaultHighlightedIndex,
          })
          const input = getInput()

          await keyDownOnInput('{ArrowDown}')

          expect(input).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(defaultHighlightedIndex),
          )
          expect(getItems()).toHaveLength(items.length)

          await keyDownOnInput('{Escape}')
          await keyDownOnInput('{ArrowDown}')

          expect(input).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(defaultHighlightedIndex),
          )
          expect(getItems()).toHaveLength(items.length)
        })

        test('opens the closed menu and keeps focus on the button', async () => {
          renderCombobox()

          await keyDownOnInput('{ArrowDown}')

          expect(getInput()).toHaveFocus()
        })

        test("it highlights option number '0' if none is highlighted", async () => {
          renderCombobox({isOpen: true})

          await keyDownOnInput('{ArrowDown}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(0),
          )
        })

        test('it highlights the next item', async () => {
          const initialHighlightedIndex = 2
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex,
          })

          await keyDownOnInput('{ArrowDown}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(initialHighlightedIndex + 1),
          )
        })

        test('with shift it highlights the next 5th item', async () => {
          const initialHighlightedIndex = 2
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex,
          })

          await keyDownOnInput('{Shift>}{ArrowDown}{/Shift}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(initialHighlightedIndex + 5),
          )
        })

        test('with shift it highlights first item if not enough next items remaining', async () => {
          const initialHighlightedIndex = items.length - 2
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex,
          })

          await keyDownOnInput('{Shift>}{ArrowDown}{/Shift}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(0),
          )
        })

        test('will stop at last item if circularNavigatios is false', async () => {
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex: items.length - 1,
            circularNavigation: false,
          })

          await keyDownOnInput('{ArrowDown}', {shiftKey: true})

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(items.length - 1),
          )
        })

        test('will continue from last item to 0 if circularNavigatios is default', async () => {
          renderCombobox({
            isOpen: true,
            initialHighlightedIndex: items.length - 1,
          })

          await keyDownOnInput('{ArrowDown}')

          expect(getInput()).toHaveAttribute(
            'aria-activedescendant',
            defaultIds.getItemId(0),
          )
        })
      })

      test('end it highlights the last option number', async () => {
        renderCombobox({
          isOpen: true,
          initialHighlightedIndex: 2,
        })

        await keyDownOnInput('{End}')

        expect(getInput()).toHaveAttribute(
          'aria-activedescendant',
          defaultIds.getItemId(items.length - 1),
        )
      })

      test('end it prevents the default event and calls dispatch only when menu is open', () => {
        const {rerender, renderSpy} = renderCombobox({isOpen: false})
        const input = getInput()
        const keyDownEvent = createEvent.keyDown(input, {key: 'End'})

        renderSpy.mockClear()
        fireEvent(input, keyDownEvent)

        expect(keyDownEvent.defaultPrevented).toBe(false)
        expect(renderSpy).not.toHaveBeenCalled()

        rerender({isOpen: true})
        renderSpy.mockClear()
        fireEvent(input, keyDownEvent)

        expect(keyDownEvent.defaultPrevented).toBe(true)
        expect(renderSpy).toHaveBeenCalledTimes(1)
      })

      test('home it highlights the first option number', async () => {
        renderCombobox({
          isOpen: true,
          initialHighlightedIndex: 2,
        })

        await keyDownOnInput('{Home}')

        expect(getInput()).toHaveAttribute(
          'aria-activedescendant',
          defaultIds.getItemId(0),
        )
      })

      test('home it prevents the default event calls dispatch only when menu is open', () => {
        const {rerender, renderSpy} = renderCombobox({isOpen: false})
        const input = getInput()
        const keyDownEvent = createEvent.keyDown(input, {key: 'Home'})

        renderSpy.mockClear()
        fireEvent(input, keyDownEvent)

        expect(keyDownEvent.defaultPrevented).toBe(false)
        expect(renderSpy).not.toHaveBeenCalled()

        rerender({isOpen: true})
        renderSpy.mockClear()
        fireEvent(input, keyDownEvent)

        expect(keyDownEvent.defaultPrevented).toBe(true)
        expect(renderSpy).toHaveBeenCalledTimes(1) // re-render on key
      })

      test('escape with menu open has the menu closed and focused kept on input', async () => {
        renderCombobox({
          initialIsOpen: true,
          initialHighlightedIndex: 2,
          initialSelectedItem: items[0],
        })
        const input = getInput()

        await keyDownOnInput('{Escape}')

        expect(getItems()).toHaveLength(0)
        expect(input).toHaveValue(items[0])
        expect(input).toHaveFocus()
      })

      test('escape with closed menu has item removed and focused kept on input', async () => {
        renderCombobox({
          initialHighlightedIndex: 2,
          initialSelectedItem: items[0],
        })
        const input = getInput()

        input.focus()
        await keyDownOnInput('{Escape}')

        expect(getItems()).toHaveLength(0)
        expect(input).toHaveValue('')
        expect(input).toHaveFocus()
      })

      test('escape it prevents the rerender when menu closed, no selectedItem and no inputValue', async () => {
        const {renderSpy, rerender} = renderCombobox({
          isOpen: false,
          inputValue: '',
        })

        renderSpy.mockClear()
        await keyDownOnInput('{Escape}')

        expect(renderSpy).toHaveBeenCalledTimes(0) // no re-render

        rerender({isOpen: true, inputValue: ''})
        renderSpy.mockClear() // reset rerender and initial render
        await keyDownOnInput('{Escape}')

        expect(renderSpy).toHaveBeenCalledTimes(1) // re-render on key

        rerender({isOpen: false, inputValue: 'still'})
        renderSpy.mockClear() // reset rerender and initial render
        await keyDownOnInput('{Escape}')

        expect(renderSpy).toHaveBeenCalledTimes(1) // re-render on key
      })

      test('escape stops propagation when it closes the menu or clears the input', () => {
        renderCombobox({
          initialIsOpen: true,
          initialSelectedItem: items[0],
        })
        const input = getInput()
        const keyDownEvents = [
          createEvent.keyDown(input, {key: 'Escape'}),
          createEvent.keyDown(input, {key: 'Escape'}),
          createEvent.keyDown(input, {key: 'Escape'}),
        ]

        for (let index = 0; index < keyDownEvents.length; index++) {
          fireEvent(input, keyDownEvents[index])
          expect(keyDownEvents[index].defaultPrevented).toBe(
            index !== keyDownEvents.length - 1,
          )
        }
      })

      test('enter it closes the menu and selects highlighted item', async () => {
        const initialHighlightedIndex = 2
        renderCombobox({
          initialIsOpen: true,
          initialHighlightedIndex,
        })

        await keyDownOnInput('{Enter}')

        expect(getItems()).toHaveLength(0)
        expect(getInput()).toHaveValue(items[initialHighlightedIndex])
      })

      test('enter selects highlighted item and resets to user defaults', async () => {
        const defaultHighlightedIndex = 2
        renderCombobox({
          defaultHighlightedIndex,
          defaultIsOpen: true,
        })
        const input = getInput()

        await keyDownOnInput('{Enter}')

        expect(input).toHaveValue(items[defaultHighlightedIndex])
        expect(getItems()).toHaveLength(items.length)
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          defaultIds.getItemId(defaultHighlightedIndex),
        )
      })

      test('enter while IME composing will not select highlighted item', async () => {
        const initialHighlightedIndex = 2
        renderCombobox({
          initialHighlightedIndex,
          initialIsOpen: true,
        })
        const input = getInput()

        fireEvent.keyDown(getInput(), {key: 'Enter', keyCode: 229})

        expect(input).toHaveValue('')
        expect(getItems()).toHaveLength(items.length)
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          defaultIds.getItemId(initialHighlightedIndex),
        )

        await keyDownOnInput('{Enter}')

        expect(input).toHaveValue(items[2])
        expect(getItems()).toHaveLength(0)
        expect(input).not.toHaveAttribute('aria-activedescendant')
      })

      test('enter with a closed menu does nothing', async () => {
        renderCombobox({
          initialHighlightedIndex: 2,
          initialIsOpen: false,
        })

        await keyDownOnInput('{Enter}')

        expect(getItems()).toHaveLength(0)
        expect(getInput()).not.toHaveValue()
      })

      test('enter with an open menu does nothing without a highlightedIndex', async () => {
        renderCombobox({
          initialIsOpen: true,
        })

        await keyDownOnInput('{Enter}')

        expect(getItems()).toHaveLength(items.length)
        expect(getInput()).not.toHaveValue()
      })

      test('enter with closed menu, no item highlighted or composing event, it will not rerender or prevent event default', () => {
        const {renderSpy, rerender} = renderCombobox({
          isOpen: false,
          highlightedIndex: -1,
        })
        const input = getInput()
        let keyDownEvent = createEvent.keyDown(input, {key: 'Enter'})

        renderSpy.mockClear()
        fireEvent(input, keyDownEvent)

        expect(renderSpy).not.toHaveBeenCalled()
        expect(keyDownEvent.defaultPrevented).toBe(false)

        rerender({
          isOpen: true,
          highlightedIndex: -1,
        })
        renderSpy.mockClear()
        fireEvent(input, keyDownEvent)

        expect(renderSpy).not.toHaveBeenCalled()
        expect(keyDownEvent.defaultPrevented).toBe(false)

        keyDownEvent = createEvent.keyDown(input, {key: 'Enter', keyCode: 229})
        rerender({
          isOpen: true,
          highlightedIndex: 2,
        })
        renderSpy.mockClear()
        fireEvent(input, keyDownEvent)

        expect(renderSpy).not.toHaveBeenCalled()
        expect(keyDownEvent.defaultPrevented).toBe(false)

        keyDownEvent = createEvent.keyDown(input, {key: 'Enter'})
        fireEvent(input, keyDownEvent)

        expect(renderSpy).toHaveBeenCalledTimes(1)
        expect(keyDownEvent.defaultPrevented).toBe(true)
      })

      test('tab it closes the menu and selects highlighted item', async () => {
        const initialHighlightedIndex = 2
        renderCombobox(
          {initialIsOpen: true, initialHighlightedIndex: 2},
          ui => {
            return (
              <>
                {ui}
                <div tabIndex={0}>Second element</div>
              </>
            )
          },
        )

        await tab()

        expect(getItems()).toHaveLength(0)
        expect(getInput()).toHaveValue(items[initialHighlightedIndex])
      })

      test('tab it prevents the rerender and does not call dispatch when menu is closed', async () => {
        const {renderSpy, rerender} = renderCombobox({isOpen: false})

        renderSpy.mockClear()
        await tab()

        expect(renderSpy).toHaveBeenCalledTimes(0)

        rerender({isOpen: true})
        renderSpy.mockClear()
        await tab()

        expect(renderSpy).toHaveBeenCalledTimes(1)
      })

      test('shift+tab it closes the menu', async () => {
        const initialHighlightedIndex = 2
        renderCombobox(
          {initialIsOpen: true, initialHighlightedIndex: 2},
          ui => {
            return (
              <>
                <div tabIndex={0}>First element</div>
                {ui}
              </>
            )
          },
        )

        await tab(true)

        expect(getItems()).toHaveLength(0)
        expect(getInput()).toHaveValue(items[initialHighlightedIndex])
      })

      test("other than the ones supported don't affect anything", async () => {
        const highlightedIndex = 2
        renderCombobox({
          initialIsOpen: true,
          initialHighlightedIndex: highlightedIndex,
          initialSelectedItem: items[highlightedIndex],
        })
        const input = getInput()

        await keyDownOnInput('{Alt}')
        await keyDownOnInput('{Control}')

        expect(input).toHaveFocus()
        expect(input).toHaveValue(items[highlightedIndex])
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          defaultIds.getItemId(highlightedIndex),
        )
        expect(getItems()).toHaveLength(items.length)
      })
    })

    describe('on blur', () => {
      test('the open menu will be closed and highlighted item will be selected', async () => {
        const initialHighlightedIndex = 2
        renderCombobox({
          initialIsOpen: true,
          initialHighlightedIndex,
        })

        await tab()

        expect(getItems()).toHaveLength(0)
        expect(getInput()).toHaveValue(items[initialHighlightedIndex])
      })

      test('the open menu will be closed and highlighted item will not be selected if the highlight by mouse leaves the menu', async () => {
        const initialHighlightedIndex = 2
        renderCombobox({
          initialIsOpen: true,
          initialHighlightedIndex,
        })

        await mouseMoveItemAtIndex(initialHighlightedIndex)
        await mouseLeaveItemAtIndex(initialHighlightedIndex)
        await tab()

        expect(getItems()).toHaveLength(0)
        expect(getInput()).toHaveValue('')
      })

      test('the value in the input will stay the same', async () => {
        const inputValue = 'test me'
        renderCombobox({
          initialIsOpen: true,
        })

        await changeInputValue(inputValue)
        await tab()

        expect(getInput()).toHaveValue(inputValue)
      })

      test('by mouse is not triggered if target is within downshift', () => {
        const stateReducer = jest.fn().mockImplementation(s => s)
        const {container} = renderCombobox({
          isOpen: true,
          highlightedIndex: 0,
          stateReducer,
        })
        const input = getInput()
        document.body.appendChild(container)

        fireEvent.mouseDown(input)
        fireEvent.mouseUp(input)

        expect(stateReducer).not.toHaveBeenCalled()

        fireEvent.mouseDown(document.body)
        fireEvent.mouseUp(document.body)

        expect(stateReducer).toHaveBeenCalledTimes(1)
        expect(stateReducer).toHaveBeenCalledWith(
          {
            highlightedIndex: 0,
            inputValue: '',
            isOpen: true,
            selectedItem: null,
          },
          expect.objectContaining({
            type: stateChangeTypes.InputBlur,
            changes: {
              highlightedIndex: -1,
              inputValue: '',
              isOpen: false,
              selectedItem: null,
            },
          }),
        )
      })

      test('by touch is not triggered if target is within downshift', () => {
        const stateReducer = jest.fn().mockImplementation(s => s)
        const {container} = renderCombobox({
          isOpen: true,
          highlightedIndex: 0,
          stateReducer,
        })
        const input = getInput()
        document.body.appendChild(container)

        fireEvent.touchStart(input)
        fireEvent.touchMove(input)
        fireEvent.touchEnd(input)

        expect(stateReducer).not.toHaveBeenCalled()

        fireEvent.touchStart(document.body)
        fireEvent.touchEnd(document.body)

        expect(stateReducer).toHaveBeenCalledTimes(1)
        expect(stateReducer).toHaveBeenCalledWith(
          {
            highlightedIndex: 0,
            inputValue: '',
            isOpen: true,
            selectedItem: null,
          },
          expect.objectContaining({
            type: stateChangeTypes.InputBlur,
            changes: {
              highlightedIndex: -1,
              inputValue: '',
              isOpen: false,
              selectedItem: null,
            },
          }),
        )
      })
    })
  })

  describe('non production errors', () => {
    beforeEach(() => {
      const {useGetterPropsCalledChecker} = jest.requireActual('../../utils')
      jest
        .spyOn(utils, 'useGetterPropsCalledChecker')
        .mockImplementation(useGetterPropsCalledChecker)
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    test('will be displayed if getInputProps is not called', () => {
      renderHook(() => {
        const {getMenuProps, getComboboxProps} = useCombobox({items})
        getMenuProps({}, {suppressRefError: true})
        getComboboxProps({}, {suppressRefError: true})
      })

      // eslint-disable-next-line no-console
      expect(console.error.mock.calls[0][0]).toMatchInlineSnapshot(
        `downshift: You forgot to call the getInputProps getter function on your component / element.`,
      )
    })

    test('will not be displayed if getInputProps is not called on subsequent renders', () => {
      let firstRender = true
      const {rerender} = renderHook(() => {
        const {getInputProps, getMenuProps, getComboboxProps} = useCombobox({
          items,
        })
        getMenuProps({}, {suppressRefError: true})
        getComboboxProps({}, {suppressRefError: true})

        if (firstRender) {
          firstRender = false
          getInputProps({}, {suppressRefError: true})
        }
      })

      rerender()

      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled()
    })

    test('will be displayed if element ref is not set and suppressRefError is false', () => {
      renderHook(() => {
        const {getInputProps, getMenuProps, getComboboxProps} = useCombobox({
          items,
        })

        getMenuProps({}, {suppressRefError: true})
        getComboboxProps({}, {suppressRefError: true})
        getInputProps()
      })

      // eslint-disable-next-line no-console
      expect(console.error.mock.calls[0][0]).toMatchInlineSnapshot(
        `downshift: The ref prop "ref" from getInputProps was not applied correctly on your element.`,
      )
    })

    test('will not be displayed if called with a correct ref', () => {
      const refFn = jest.fn()
      const inputNode = {}

      renderHook(() => {
        const {getInputProps, getMenuProps, getComboboxProps} = useCombobox({
          items,
        })

        getMenuProps({}, {suppressRefError: true})
        getComboboxProps({}, {suppressRefError: true})

        const {ref} = getInputProps({
          ref: refFn,
        })
        ref(inputNode)
      })

      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled()
    })
  })
})
