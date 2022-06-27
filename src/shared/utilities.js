export const getNearest = (slots, entry) => {
  return slots
    .filter((slot) => slot.isOccupied === false)
    .sort((a, b) => a.distance[entry] - b.distance[entry])[0];
};

export const getAvailableSizes = (slots, size) => {
  return slots.filter((slot) => slot.size >= size && slot.isOccupied === false);
};

export const getParkingFee = (size) => {
  switch (size) {
    case 0:
      return 20;
    case 1:
      return 60;
    case 2:
      return 100;
  }
};

export const isReturnee = (vehicle) => {
  if (!vehicle.lastParkOut) return false;

  const lastTimeOut = new Date(vehicle.lastParkOut);
  const timeIn = new Date(vehicle.parkIn);

  const hours = parseInt(
    (Math.abs(timeIn - lastTimeOut) / (1000 * 60 * 60)) % 24
  );
  if (hours > 1) return false;
  else return true;
};

export const calculateFee = (vehicle) => {
  var fee = 0;
  const timeIn = new Date(vehicle.parkIn);

  const timeOut = new Date();
  const days = parseInt((timeOut - timeIn) / (1000 * 60 * 60 * 24));
  var hours = parseInt((Math.abs(timeOut - timeIn) / (1000 * 60 * 60)) % 24);
  const minutes = parseInt(
    (Math.abs(timeOut.getTime() - timeIn.getTime()) / (1000 * 60)) % 60
  );
  const seconds = parseInt(
    (Math.abs(timeOut.getTime() - timeIn.getTime()) / 1000) % 60
  );

  if (minutes > 0 || seconds > 0) {
    hours += 1;
  }

  const returnee = isReturnee(vehicle);

  if (returnee) {
    fee += hours * vehicle.parkingFee;
  } else {
    fee += 40;
    if (days > 0) {
      fee += 5000;
    }
    if (hours > 3) {
      fee += (hours - 3) * vehicle.parkingFee;
    }
  }

  console.log("DAYS: ", days);
  console.log("HOURS: ", hours);
  console.log("MINUTES: ", minutes);
  //   return fee;
  return { returnee, days, hours, minutes, fee };
};

export const hasRecord = (vehicles, plate) => {
  return vehicles.find((vehicle) => vehicle.plate === plate);
};
