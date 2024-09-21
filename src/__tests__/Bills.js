/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import userEvent from '@testing-library/user-event'

import router from "../app/Router.js";

$.fn.modal = jest.fn(); 


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression active-icon
      expect(windowIcon.classList).toContain('active-icon')
      
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    describe("When I click on eye button", () => {
      test("The handleClickIconEye are called", async () => {
        const billsController = new Bills({
          document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
        })
        document.body.innerHTML = BillsUI({ data: bills })
        //on recupere le premier icon-eye avec[0]
        const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)[0] 
        // on simule le click avec jest.fn()
        const handleClickIconEyeMock = jest.fn(() => billsController.handleClickIconEye(iconEye))
        iconEye.addEventListener('click', handleClickIconEyeMock)
        userEvent.click(iconEye)
        expect(handleClickIconEyeMock).toHaveBeenCalled()
      })
    })
  })
})