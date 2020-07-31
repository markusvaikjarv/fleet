import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input, Button, Table, message } from 'antd';
import DateOverview from './components/DateOverview';
import LeafletBox from './leaflet/LeafletBox';
import 'antd/dist/antd.css';
import styled from 'styled-components';

const ApiKeyInput = styled(Input)`
	width: 80%;
	margin-bottom: 10px;
`;

const GoButton = styled(Button)`
	width: 20%;
`;

const App = () => {
	const [apiKey, setApiKey] = useState();
	const [latestData, setLatestData] = useState([]);
	const [selectedVehicle, setSelectedVehicle] = useState();
	const [selectedRowKey, setSelectedRowKey] = useState([]);

	useEffect(() => {
		const queryParams = new URLSearchParams(window.location.search);
		setApiKey(queryParams.get('apiKey'));
	}, []);

	const queryLatestData = async (apiKey) => {
		LeafletBox.clearAll();

		let data;
		try {
			({ data } = await axios(`https://app.ecofleet.com/seeme/Api/Vehicles/getLastData?key=${apiKey}&json`));
		} catch (err) {
			console.error(err);
			message.error({ content: 'Failed to fetch latest vehicle data' });
			setApiKey();
			return setLatestData([]);
		}

		const formattedDataPoints = [];
		let key = 0;
		for (const dataPoint of data.response) {
			formattedDataPoints.push({
				key,
				objectId: dataPoint.objectId,
				timestamp: dataPoint.timestamp,
				plate: dataPoint.plate,
				speed: dataPoint.speed,
				position: [dataPoint.latitude, dataPoint.longitude],
			});
			key++;
			LeafletBox.addTooltip([dataPoint.latitude, dataPoint.longitude], dataPoint.plate);
		}

		setLatestData(formattedDataPoints);
		message.success({ content: 'Updated vehicle data' });
	};

	const rowSelection = {
		type: 'radio',
		selectedRowKeys: selectedRowKey,
		onChange: rowKey => selectVehicle(rowKey),
	};

	const columns = [{
		title: 'Plate',
		dataIndex: 'plate',
	}, {
		title: 'Speed',
		dataIndex: 'speed',
		render: speed => `${speed || 0} km/h`
	}, {
		title: 'Last update',
		dataIndex: 'timestamp',
	}];

	const selectVehicle = (rowKey) => {
		const vehicle = latestData.find(dataPoint => dataPoint.key === rowKey);

		setSelectedRowKey([rowKey]);
		setSelectedVehicle(vehicle);

		LeafletBox.setPosition(vehicle.position);
	};

	return (
		<div className="App">
			<ApiKeyInput placeholder="Enter your API key here" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
			<GoButton type="primary" disabled={!apiKey} onClick={async () => { await queryLatestData(apiKey); }}>
				Show my fleet
			</GoButton>
			<Table
				rowSelection={rowSelection}
				columns={columns}
				dataSource={latestData}
				pagination={false}
				onRow={(row) => ({
					onClick: () => selectVehicle(row.key),
				})}
			/>
			<DateOverview vehicle={selectedVehicle} apiKey={apiKey} />
		</div>
	);
};

export default App;
