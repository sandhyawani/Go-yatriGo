//columns for the user table
export const userColumns = [
  // { field: "_id", headerName: "ID", width: 250 },
  {
    field: "Image",
    headerName: "Image",
    width: 70,
    renderCell: (params) => {
      return (
        <div className="cellWithImg">
          <img
            className="cellImg"
            src={params.row.img || `https://ui-avatars.com/api/?name=${params.row.name}&background=7c3aed&color=fff`}
            alt="avatar"
          />
        </div>
      );
    },
  },
  {
    field: "name",
    headerName: "Name",
    width: 200,
  },
  {
    field: "email",
    headerName: "Email",
    width: 300,
  },

  {
    field: "mobile",
    headerName: "Mobile",
    width: 150,
  },
  {
    field: "country",
    headerName: "Country",
    width: 150,
  },
  {
    field: "type",
    headerName: "Type",
    width: 150,
  },
];

//columns for the vehicle table
export const vehicleColumns = [
  //{ field: "_id", headerName: "ID", width: 220 },
  {
    field: "Image",
    headerName: "Image",
    width: 70,
    renderCell: (params) => {
      return (
        <div className="cellWithImg">
          <img
            className="cellImg"
            src={
              params.row.vehicleMainImg?.startsWith('http') 
                ? params.row.vehicleMainImg 
                : `/vehicle/images/${params.row.vehicleMainImg}` ||
              "https://i.ibb.co/MBtjqXQ/no-avatar.gif"
            }
            alt="avatar"
          />
        </div>
      );
    },
  },
  {
    field: "brand",
    headerName: "Brand",
    width: 100,
  },
  {
    field: "model",
    headerName: "Model",
    width: 100,
  },
  {
    field: "ownerName",
    headerName: "Owner Name",
    width: 230,
  },
  {
    field: "vehicleType",
    headerName: "Vehicle Type",
    width: 150,
  },
  {
    field: "vehicleNumber",
    headerName: "vehicle Number",
    width: 150,
  },
  {
    field: "capacity",
    headerName: "Capacity",
    width: 100,
  },
  {
    field: "location",
    headerName: "Location",
    width: 150,
  },
  {
    field: "status",
    headerName: "Status",
    width: 120,
    renderCell: (params) => (
      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
          params.value === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
          params.value === 'PENDING' ? 'bg-amber-50 text-amber-600' :
          params.value === 'SUSPENDED' ? 'bg-slate-100 text-slate-600' :
          'bg-rose-50 text-rose-600'
      }`}>
          {params.value || 'PENDING'}
      </div>
    )
  },
];

export const vehicleReservationColumns = [
  //{ field: "_id", headerName: "ID", width: 220 },
  {
    field: "date",
    headerName: "Date",
    width: 110,
  },
  {
    field: "vehicleNumber",
    headerName: "Vehicle Number",
    width: 100,
  },
  {
    field: "location",
    headerName: "Location",
    width: 150,
  },

  {
    field: "vehicleNumber",
    headerName: "Vehicle Number",
    width: 150,
  },
  {
    field: "pickupDate",
    headerName: "Pickup Date",
    width: 110,
  },
  {
    field: "returnDate",
    headerName: "Return Date",
    width: 110,
  },
  {
    field: "price",
    headerName: "Price",
    width: 110,
  },
  {
    field: "needDriver",
    headerName: "Need Driver",
    width: 110,
  },
];

export const hotelColumns = [
  //{ field: "_id", headerName: "ID", width: 220 },
  {
    field: "Image",
    headerName: "Image",
    width: 70,
    renderCell: (params) => {
      return (
        <div className="cellWithImg">
          <img
            className="cellImg"
            src={
              params.row.HotelImg?.startsWith('http')
                ? params.row.HotelImg
                : `/hotels/images/${params.row.HotelImg}` ||
              "https://i.ibb.co/MBtjqXQ/no-avatar.gif"
            }
            alt="avatar"
          />
        </div>
      );
    },
  },
  {
    field: "name",
    headerName: "Name",
    width: 230,
  },
  {
    field: "type",
    headerName: "Hotel Type",
    width: 100,
  },
  {
    field: "city",
    headerName: "City",
    width: 100,
  },
  {
    field: "contactNo",
    headerName: "Mobile",
    width: 150,
  },
  {
    field: "contactName",
    headerName: "Conatct Name",
    width: 150,
  },
  {
    field: "cheapestPrice",
    headerName: "Cheapest Price",
    width: 150,
  },
  {
    field: "status",
    headerName: "Status",
    width: 120,
    renderCell: (params) => (
      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
          params.value === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
          params.value === 'PENDING' ? 'bg-amber-50 text-amber-600' :
          params.value === 'SUSPENDED' ? 'bg-slate-100 text-slate-600' :
          'bg-rose-50 text-rose-600'
      }`}>
          {params.value || 'PENDING'}
      </div>
    )
  },
];


export const restaurantColumns = [
  {
    field: "Image",
    headerName: "Image",
    width: 70,
    renderCell: (params) => {
      const imgSource = params.row.resturentImages?.[0];
      const isExternal = imgSource?.startsWith("data:") || imgSource?.startsWith("http");
      const finalSrc = isExternal ? imgSource : (imgSource ? `/restaurant/images/${imgSource}` : "https://i.ibb.co/MBtjqXQ/no-avatar.gif");
      
      return (
        <div className="cellWithImg">
          <img
            className="cellImg"
            src={finalSrc}
            alt="avatar"
          />
        </div>
      );
    },
  },
  {
    field: "name",
    headerName: "Name",
    width: 200,
  },
  {
    field: "district",
    headerName: "City",
    width: 120,
    renderCell: (params) => params.row.district?.name || "N/A",
  },
  {
    field: "returentType",
    headerName: "Type",
    width: 120,
    renderCell: (params) => params.row.returentType?.name || "N/A",
  },
  {
    field: "mobileNo",
    headerName: "Contact",
    width: 130,
  },
  {
    field: "tableCount",
    headerName: "Capacity",
    width: 100,
  },
  {
    field: "status",
    headerName: "Status",
    width: 120,
    renderCell: (params) => (
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
            params.value === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
            params.value === 'PENDING' ? 'bg-amber-50 text-amber-600' :
            params.value === 'SUSPENDED' ? 'bg-slate-100 text-slate-600' :
            'bg-rose-50 text-rose-600'
        }`}>
            {params.value || 'PENDING'}
        </div>
    )
  },
];
