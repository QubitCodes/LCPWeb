//===========================================================================
//  🔗 API ENDPOINTS
//===========================================================================

export const API_ENDPOINTS = {
  // =====================
  // 🔴 Dropdown
  // =====================
  get_states: "/api/doc/state/getAllStates",
  get_districts: "/api/doc/state/getAllDistrictsById",
  // =====================
  // 🔴 Controller
  // =====================
  getAllContrctor: "/api/doc/users/getAllUsersByRole",
  postUser: "/api/doc/auth/secured/signup",
  deleteUser: "/api/doc/auth/secured/delete/",
  get_user_address: "/api/doc/admin/users/addresses",
  get_crnt_user_address: "/api/doc/address",
  save_user_address: "/api/doc/address",
  // =====================
  // 🔴 Bands
  // =====================

  get_bands: "/api/Band/GetAllBands",
  save_band: "/api/Band/SaveBand",
  delete_band: "/api/Band/DeleteBand",

  // =====================
  // 🔴 Company
  // =====================

  get_companies: "/api/Company/GetAllCompanies",
  save_company: "/api/Company/SaveCompany",
  delete_company: "/api/Company/DeleteCompany",

  // =====================
  // 🔴 Company
  // =====================

  get_busyness_verticals: "/api/BusinessVertical/GetAllBusinessVerticals",
  save_busyness_vertical: "/api/BusinessVertical/SaveBusinessVertical",
  delete_busyness_vertical: "/api/BusinessVertical/DeleteBusinessVertical",

  // =====================
  // 🔴 Division
  // =====================

  get_divisions: "/api/Division/GetAllDivisions",
  save_division: "/api/Division/SaveDivision",
  delete_division: "/api/Division/DeleteDivision",
  // =====================
  // 🔴 Country
  // =====================

  get_countries: "/api/Country/GetAllCountries",
  save_country: "/api/Country/SaveCountry",
  delete_country: "/api/Country/DeleteCountry",

  // =====================
  // 🔴 DropDown
  // =====================

  get_company_dropdown: "/api/Dropdown/getAllCompanyDropdown",
  get_busyness_vertical_dropdown:
    "/api/Dropdown/getAllBusinessVerticalDropdown",
  get_country_dropdown: "/api/Dropdown/getAllCountryDropdown",
  get_division_dropdown: "/api/Dropdown/getAllDivisionDropdown",
};
