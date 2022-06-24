import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import {
  calculateFee,
  getAvailableSizes,
  getNearest,
  getParkingFee,
  hasRecord,
} from "../../shared/utilities";
import axios from "axios";

function ParkingLot() {
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API}/vehicles`)
      .then((result) => setVehicles(result.data.data))
      .catch((err) => console.log(err));
  }, []);
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API}/slots`)
      .then((result) => setSlots(result.data.data))
      .catch((err) => console.log(err));
  }, []);
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API}/settings`)
      .then((result) => setSettings(result.data.data))
      .catch((err) => console.log(err));
  }, []);

  const [settings, setSettings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [unparkModal, setUnparkModal] = useState(false);
  const [slotModal, setSlotModal] = useState(false);
  const [addSlotModal, setAddSlotModal] = useState(false);
  const [entryPoint, setEntryPoint] = useState(null);
  const [size, setSize] = useState(null);
  const [plate, setPlate] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  //   ADD PARKING SLOT
  const [slotSize, setSlotSize] = useState(0);
  const [distance, setDistance] = useState([]);

  const handleEditSlot = (slot) => {
    setSelectedSlot(slot);
    setSlotModal(true);
  };

  const handleSubmitSlot = () => {
    axios
      .patch(`${process.env.REACT_APP_API}/slots/${selectedSlot.id}`, {
        distance: selectedSlot.distance,
      })
      .then((res) => {
        setSelectedSlot(null);
        window.location.reload();
      });
  };

  const updateSlots = (id) => {
    axios
      .patch(`${process.env.REACT_APP_API}/slots/${id}`, { isOccupied: true })
      .then((res) => {
        window.location.reload();
      });
  };

  const addEntryPoints = () => {
    axios
      .patch(`${process.env.REACT_APP_API}/settings/${settings.id}`, {
        points: settings.points + 1,
      })
      .then((res) => {
        alert("Successfully added new entry points!");
        window.location.reload();
      });
  };

  const updateVehicles = async (id, fee) => {
    const record = hasRecord(vehicles, plate) || null;
    if (record) {
      console.log("naay record");
      await axios.patch(`${process.env.REACT_APP_API}/vehicles/${record.id}`, {
        parkingSlot: id,
        parkingFee: fee,
        status: "parking",
        parkIn: new Date(),
      });
    } else {
      await axios.post(`${process.env.REACT_APP_API}/vehicles`, {
        parkingSlot: id,
        parkingFee: fee,
        status: "parking",
        parkIn: new Date(),
        plate: plate,
      });
    }
  };

  const handleSubmit = () => {
    setModalShow(false);
    var slotId = "";
    var parkingFee = 0;
    if (size === 0) {
      const nearest = getNearest(slots, entryPoint);
      slotId = nearest.id;
      parkingFee = getParkingFee(nearest.size);
    } else {
      const result = getAvailableSizes(slots, size);
      const nearest = getNearest(result, entryPoint);
      slotId = nearest.id;
      parkingFee = getParkingFee(nearest.size);
    }
    updateSlots(slotId);
    updateVehicles(slotId, parkingFee);
  };

  const handleEntryChange = (point) => {
    setEntryPoint(point);
  };

  const handleSizeChange = (size) => {
    setSize(size);
  };

  const handleUnpark = () => {
    setUnparkModal(false);
    const { returnee, days, hours, minutes, fee } =
      calculateFee(selectedVehicle);
    Modal.confirm({
      title: "Confirm",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Returnee: {returnee.toString()}</p>
          <p>Days: {days}</p>
          <p>Hours: {hours - 1}</p>
          <p>Minutes: {minutes}</p>
          <p>
            Parking slot hourly rate (if exceed 3hrs):{" "}
            {selectedVehicle.parkingFee}
          </p>
          <h1>Total Fee: {fee}</h1>
        </div>
      ),
      onOk: async () => {
        await axios.patch(
          `${process.env.REACT_APP_API}/slots/${selectedVehicle.parkingSlot}`,
          { isOccupied: false }
        );
        await axios.patch(
          `${process.env.REACT_APP_API}/vehicles/${selectedVehicle.id}`,
          { lastParkOut: new Date(), parkIn: null, status: "away" }
        );
        window.location.reload();
      },
    });
  };

  const handleDistanceChange = (value, index) => {
    var newDistance = selectedSlot.distance;
    newDistance[index] = parseInt(value);
    setSelectedSlot({ ...selectedSlot, distance: newDistance });
  };

  const handleAddDistanceChange = (value, index) => {
    var newDistance = distance;
    newDistance[index] = parseInt(value);
    console.log("new distance: ", newDistance);
    setDistance(newDistance);
  };

  const handleAddSlot = async () => {
    await axios.post(`${process.env.REACT_APP_API}/slots`, {
      distance: distance,
      size: slotSize,
      isOccupied: false,
    });

    setAddSlotModal(false);
    window.location.reload();
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          className="bg-blue-500 text-white px-10 py-2 rounded-sm"
          onClick={() => setModalShow(true)}
        >
          Park Vehicle
        </button>
        <button
          className="bg-blue-500 text-white px-10 py-2 rounded-sm"
          onClick={() => setUnparkModal(true)}
        >
          Unpark Vehicle
        </button>
        <button
          className="bg-blue-500 text-white px-10 py-2 rounded-sm"
          onClick={addEntryPoints}
        >
          Add entry point
        </button>
        <button
          className="bg-blue-500 text-white px-10 py-2 rounded-sm"
          onClick={() => setAddSlotModal(true)}
        >
          Add parking slot
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-10">
        {slots.map((slot, index) => (
          <div
            key={slot.id}
            className={`${
              slot.isOccupied ? "bg-gray-400" : "bg-green-400"
            } flex-1 h-12 grid place-items-center`}
            onClick={() => handleEditSlot(slot)}
          >
            Parking {index}
          </div>
        ))}
      </div>

      {/* ADD PARKING SLOT MODAL */}
      <Modal
        title="Parking Slot Details"
        visible={addSlotModal}
        onOk={handleAddSlot}
        onCancel={() => setAddSlotModal(false)}
      >
        <div>
          <div className="flex items-center gap-2">
            <input
              onClick={() => setSlotSize(0)}
              type="radio"
              checked={slotSize === 0}
            />
            <p>Small</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              onClick={() => setSlotSize(1)}
              type="radio"
              checked={slotSize === 1}
            />
            <p>Medium</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              onClick={() => setSlotSize(2)}
              type="radio"
              checked={slotSize === 2}
            />
            <p>Large</p>
          </div>
          <div className="flex flex-col gap-2">
            {[...new Array(settings.points)].map((item, index) => (
              <div className="flex items-center gap-2" key={index}>
                <p>Entry point {index + 1}: </p>
                <input
                  type="text"
                  name=""
                  id=""
                  className="border border-gray-400 px-2"
                  value={distance[index]}
                  onChange={(e) =>
                    handleAddDistanceChange(e.target.value, index)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* EDIT PARKING SLOT MODAL */}
      <Modal
        title="Parking Slot Details"
        visible={slotModal}
        onOk={handleSubmitSlot}
        onCancel={() => setSlotModal(false)}
      >
        <div>
          <p>Size: {selectedSlot?.size}</p>
          <div className="flex flex-col gap-2">
            {[...new Array(settings.points)].map((item, index) => (
              <div className="flex items-center gap-2" key={index}>
                <p>Entry point {index + 1}: </p>
                <input
                  type="text"
                  name=""
                  id=""
                  className="border border-gray-400 px-2"
                  value={selectedSlot?.distance[index] || ""}
                  onChange={(e) => handleDistanceChange(e.target.value, index)}
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* UNPARK VEHICLE MODAL */}
      <Modal
        title="Vehicle Details"
        visible={unparkModal}
        onOk={handleUnpark}
        onCancel={() => setUnparkModal(false)}
      >
        <div>
          {vehicles
            .filter((vehicle) => vehicle.status === "parking")
            .map((vehicle) => (
              <div className="flex items-center gap-2" key={vehicle.id}>
                <input
                  onClick={() => setSelectedVehicle(vehicle)}
                  type="radio"
                  checked={selectedVehicle?.id === vehicle.id}
                />
                <p>{vehicle.plate}</p>
              </div>
            ))}
        </div>
      </Modal>

      {/* PARK VEHICLE MODAL */}
      <Modal
        title="Vehicle Details"
        visible={modalShow}
        onOk={handleSubmit}
        onCancel={() => setModalShow(false)}
      >
        <div>
          <p>Plate number</p>
          <input
            type="text"
            className="border border-gray-200 w-full py-1 px-2 mb-2"
            autoFocus
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
          <h2>Entry point:</h2>
          {[...new Array(settings.points)].map((item, index) => (
            <div className="flex items-center gap-2" key={index}>
              <input
                onClick={() => handleEntryChange(index)}
                type="radio"
                checked={entryPoint === index}
              />
              <p>{index + 1}</p>
            </div>
          ))}
          {/* <div className="flex items-center gap-2">
            <input
              onClick={() => handleEntryChange(0)}
              type="radio"
              checked={entryPoint === 0}
            />
            <p>1</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              onClick={() => handleEntryChange(1)}
              type="radio"
              checked={entryPoint === 1}
            />
            <p>2</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              onClick={() => handleEntryChange(2)}
              type="radio"
              checked={entryPoint === 2}
            />
            <p>3</p>
          </div> */}
        </div>
        <div>
          <h2>Size:</h2>
          <div className="flex items-center gap-2">
            <input
              onClick={() => handleSizeChange(0)}
              type="radio"
              checked={size === 0}
            />
            <p>Small</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              onClick={() => handleSizeChange(1)}
              type="radio"
              checked={size === 1}
            />
            <p>Medium</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              onClick={() => handleSizeChange(2)}
              type="radio"
              checked={size === 2}
            />
            <p>Large</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ParkingLot;
