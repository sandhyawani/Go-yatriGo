import React from "react";

// Column definitions for Admin User Management Datatable
export const userColumns = [
  {
    field: "Image",
    headerName: "Avatar",
    width: 70,
    renderCell: (params) => {
      const avatarSrc =
        params.row.img ||
        params.row.avatar ||
        params.row.pic ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          params.row.name || "User"
        )}&background=0284c7&color=fff`;

      return (
        <div className="cellWithImg">
          <img className="cellImg" src={avatarSrc} alt={params.row.name || "User"} />
        </div>
      );
    }
  },
  {
    field: "name",
    headerName: "Name",
    width: 200
  },
  {
    field: "email",
    headerName: "Email",
    width: 260
  },
  {
    field: "mobile",
    headerName: "Mobile",
    width: 140,
    renderCell: (params) => params.row.mobile || "N/A"
  },
  {
    field: "city",
    headerName: "City",
    width: 130,
    renderCell: (params) => params.row.city || "-"
  },
  {
    field: "state",
    headerName: "State",
    width: 130,
    renderCell: (params) => params.row.state || "-"
  },
  {
    field: "type",
    headerName: "Role",
    width: 130,
    renderCell: (params) => params.row.type || (params.row.isAdmin ? "admin" : "traveler")
  }
];