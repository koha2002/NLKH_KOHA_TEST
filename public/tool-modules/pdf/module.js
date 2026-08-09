// --- DOM Elements ---
        var fileInput = document.getElementById('fileInput');
        var fileNameDisplay = document.getElementById('fileName');
        var processButton = document.getElementById('processButton');
        var clearButton = document.getElementById('clearButton');
        var apiToolSelect = document.getElementById('apiTool');
        var toolOptions = document.getElementById('toolOptions');
        var fileListContainer = document.getElementById('fileListContainer');
        var fileList = document.getElementById('fileList');
        var statusMessage = document.getElementById('statusMessage');
        var loader = document.getElementById('loader');
        var processButtonText = document.getElementById('processButtonText');
        var resultContainer = document.getElementById('resultContainer');
        var downloadLink = document.getElementById('downloadLink');
        var previewArea = document.getElementById('previewArea');
        var previewImage = document.getElementById('previewImage');
        var previewInfo = document.getElementById('previewInfo');
        var watermarkOverlay = document.getElementById('watermarkOverlay');
        var cropOverlay = document.getElementById('cropOverlay');
        var uploadBox = document.getElementById('uploadBox');
        var emptyPreview = document.getElementById('emptyPreview');
        var selectedToolName = document.getElementById('selectedToolName');
        var quickToolButtons = document.querySelectorAll('[data-tool]');

        // --- State Variables ---
        var selectedFiles = [];
        var watermarkFile = null;
        var downloadAuthHeader = null;
        var finalDownloadUrl = null;
        var finalDownloadFilename = null;

        // --- Config ---
        var fileAcceptMap = {
            'default': '*/*', 'pdf': 'application/pdf', 'image': 'image/*',
            'wordpdf': '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'powerpointpdf': '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'excelpdf': '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        var multiFileTools = ['merge', 'imagepdf', 'watermark', 'watermarkimage'];
        var pdfTools = ['compress', 'merge', 'split', 'unlock', 'protect', 'rotate', 'watermark', 'pdfa', 'pdfjpg', 'pagenumber', 'extract', 'repair', 'wordpdf', 'powerpointpdf', 'excelpdf'];
        var imageTools = ['compressimage', 'resizeimage', 'cropimage', 'rotateimage', 'convertimage', 'watermarkimage', 'removebackgroundimage'];
        var previewTools = ['resizeimage', 'cropimage', 'rotateimage', 'watermarkimage'];
        
        // --- Event Listeners ---
        fileInput.addEventListener('change', handleFileSelect);
        apiToolSelect.addEventListener('change', updateUiForTool);
        processButton.addEventListener('click', processFiles);
        downloadLink.addEventListener('click', downloadResult);
        clearButton.addEventListener('click', resetAll);
        quickToolButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                apiToolSelect.value = button.dataset.tool;
                updateUiForTool();
            });
        });
        ['dragenter', 'dragover'].forEach(function(eventName) {
            uploadBox.addEventListener(eventName, function(event) {
                event.preventDefault();
                uploadBox.classList.add('drag-over');
            });
        });
        ['dragleave', 'drop'].forEach(function(eventName) {
            uploadBox.addEventListener(eventName, function(event) {
                event.preventDefault();
                uploadBox.classList.remove('drag-over');
            });
        });
        uploadBox.addEventListener('drop', function(event) {
            handleFileSelect({ target: { files: event.dataTransfer.files } });
        });
        
        // --- UI Functions ---
        function setStatus(message, type) {
            if (type === undefined) { type = 'info'; }
            statusMessage.textContent = message;
            statusMessage.className = 'status-message status--' + type;
        }

        function showLoader(show) {
            loader.style.display = show ? 'block' : 'none';
            processButtonText.style.display = show ? 'none' : 'block';
            processButton.disabled = show || selectedFiles.length === 0;
        }

        function updateWorkspaceState() {
            var hasFiles = selectedFiles.length > 0;
            var hasVisualPreview = previewArea.style.display === 'flex';
            var hasFileList = !fileListContainer.classList.contains('hidden');
            processButton.disabled = !hasFiles;
            emptyPreview.classList.toggle('hidden', hasVisualPreview || hasFileList);
            if (!hasVisualPreview && !hasFileList) {
                emptyPreview.querySelector('h3').textContent = hasFiles ? 'Tệp đã sẵn sàng' : 'Không gian làm việc đang trống';
                emptyPreview.querySelector('p').textContent = hasFiles
                    ? selectedFiles[0].name + ' · Chọn “Bắt đầu xử lý” khi đã hoàn tất thiết lập.'
                    : 'Chọn một hoặc nhiều tệp ở bảng bên trái. Tệp ảnh hỗ trợ sẽ được xem trước trực tiếp tại đây.';
            }
        }

        function generateOptionsHTML(tool) {
            var commonClasses = "block w-full rounded-md sm:text-sm border-2 border-black";
            switch(tool) {
                case 'compress': case 'compressimage':
                    return `<label class="block text-sm font-medium">Mức độ nén</label><select id="compressionLevel" class="${commonClasses}"><option value="low">Nén thấp (chất lượng cao)</option><option value="recommended" selected>Khuyến nghị</option><option value="extreme">Nén cao (kích thước nhỏ)</option></select>`;
                case 'split':
                     return `<label class="block text-sm font-medium">Tách theo trang</label><input type="text" id="splitRange" placeholder="VD: 1-3,5,8-10" class="${commonClasses}" /><p class="text-xs text-gray-500">Nhập trang hoặc khoảng trang cần tách.</p>`;
                case 'rotate': case 'rotateimage':
                     return `<label class="block text-sm font-medium">Góc xoay</label><select id="rotateAngle" class="${commonClasses}"><option value="90">90 độ (phải)</option><option value="180">180 độ</option><option value="270">270 độ (trái)</option></select>`;
                case 'watermark': case 'watermarkimage':
                    return `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label class="block text-sm font-medium">Loại dấu</label><select id="watermarkMode" class="${commonClasses}"><option value="text">Văn bản</option><option value="image">Hình ảnh</option></select></div>
                            <div id="watermarkTextInputContainer"><label class="block text-sm font-medium">Nội dung</label><input type="text" id="watermarkText" value="iLovePDF" class="${commonClasses}" /></div>
                            <div id="watermarkImageInputContainer" class="hidden"><label class="block text-sm font-medium">Tệp ảnh dấu</label><input type="file" id="watermarkImageInput" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" accept="image/*" /></div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
                            <div><label class="block text-sm font-medium">Vị trí</label><select id="watermarkPosition" class="${commonClasses}"><option value="middle-center">Giữa</option><option value="top-left">Trên-Trái</option><option value="top-right">Trên-Phải</option><option value="bottom-left">Dưới-Trái</option><option value="bottom-right">Dưới-Phải</option></select></div>
                            <div><label class="block text-sm font-medium">Độ trong suốt</label><select id="watermarkTransparency" class="${commonClasses}"><option value="100">100%</option><option value="75">75%</option><option value="50" selected>50%</option><option value="25">25%</option></select></div>
                            <div><label class="block text-sm font-medium">Góc xoay</label><input type="number" id="watermarkRotation" value="0" class="${commonClasses}" /></div>
                        </div>
                        <div id="watermarkTextOptions" class="grid grid-cols-2 md:grid-cols-2 gap-4 items-end mt-4">
                            <div><label class="block text-sm font-medium">Cỡ chữ</label><input type="number" id="watermarkFontSize" value="48" class="${commonClasses}" /></div>
                            <div><label class="block text-sm font-medium">Màu chữ</label><input type="color" id="watermarkFontColor" value="#000000" class="block w-full rounded-md" /></div>
                        </div>
                        <div id="watermarkImageOptions" class="hidden grid-cols-2 md:grid-cols-2 gap-4 items-end mt-4">
                             <div><label class="block text-sm font-medium">Kích thước ảnh dấu (%)</label><input type="number" id="watermarkImageScale" value="50" min="1" max="500" class="${commonClasses}" /></div>
                        </div>
                    `;
                case 'protect': case 'unlock':
                    return `<label for="passwordInput" class="block text-sm font-medium">Mật khẩu</label><input type="password" id="passwordInput" class="${commonClasses}" placeholder="Nhập mật khẩu..."/>`;
                case 'cropimage':
                     return `<label class="block text-sm font-medium">Tọa độ cắt (px)</label><div class="grid grid-cols-2 md:grid-cols-4 gap-4"><input type="number" id="cropX" placeholder="x" value="0" class="${commonClasses}" /><input type="number" id="cropY" placeholder="y" value="0" class="${commonClasses}" /><input type="number" id="cropWidth" placeholder="rộng" class="${commonClasses}" /><input type="number" id="cropHeight" placeholder="cao" class="${commonClasses}" /></div>`;
                case 'convertimage':
                     return `<label class="block text-sm font-medium">Chuyển sang định dạng</label><select id="convertTo" class="${commonClasses}"><option value="jpg">JPG</option><option value="png">PNG</option><option value="gif">GIF</option></select>`;
                case 'resizeimage':
                     return `<div class="grid grid-cols-2 gap-4"><input type="number" id="resizeWidth" placeholder="Chiều rộng (px)" class="${commonClasses}" /><input type="number" id="resizeHeight" placeholder="Chiều cao (px)" class="${commonClasses}" /></div><div class="flex items-center mt-2"><input id="maintainAspectRatio" type="checkbox" checked class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"><label for="maintainAspectRatio" class="ml-2 block text-sm">Giữ nguyên tỷ lệ</label></div>`;
                default:
                    var toolDescriptions = {
                        extract: 'Trích xuất toàn bộ văn bản và hình ảnh từ tệp PDF của bạn vào một tệp ZIP.',
                        repair: 'Cố gắng sửa chữa và khôi phục dữ liệu từ các tệp PDF bị hỏng.',
                        removebackgroundimage: 'Tự động xóa nền khỏi hình ảnh. Hoạt động tốt nhất với các đối tượng rõ ràng.',
                        pdfa: 'Chuyển đổi PDF sang định dạng PDF/A để lưu trữ lâu dài.',
                        pagenumber: 'Tự động thêm số trang vào tệp PDF của bạn.'
                    };
                    var desc = toolDescriptions[tool] || '';
                    return `<p class="text-sm text-gray-600">${desc}</p>`;
            }
        }

        function setupOptionEventListeners(tool) {
            if (tool === 'watermark' || tool === 'watermarkimage') {
                document.getElementById('watermarkMode').addEventListener('change', updateImagePreview);
                document.getElementById('watermarkText').addEventListener('input', updateImagePreview);
                document.getElementById('watermarkImageInput').addEventListener('change', handleWatermarkFileSelect);
                document.getElementById('watermarkPosition').addEventListener('change', updateImagePreview);
                document.getElementById('watermarkTransparency').addEventListener('change', updateImagePreview);
                document.getElementById('watermarkRotation').addEventListener('change', updateImagePreview);
                document.getElementById('watermarkFontSize').addEventListener('change', updateImagePreview);
                document.getElementById('watermarkFontColor').addEventListener('input', updateImagePreview);
                document.getElementById('watermarkImageScale').addEventListener('input', updateImagePreview);
            }
            if (tool === 'rotateimage') { document.getElementById('rotateAngle').addEventListener('change', updateImagePreview); }
            if (tool === 'cropimage') { ['cropX', 'cropY', 'cropWidth', 'cropHeight'].forEach(id => document.getElementById(id).addEventListener('input', updateImagePreview)); }
            if (tool === 'resizeimage') { ['resizeWidth', 'resizeHeight'].forEach(id => document.getElementById(id).addEventListener('input', updateImagePreview)); }
        }

        function updateUiForTool() {
            var tool = apiToolSelect.value;
            selectedToolName.textContent = apiToolSelect.options[apiToolSelect.selectedIndex].text;
            quickToolButtons.forEach(function(button) {
                button.classList.toggle('active', button.dataset.tool === tool);
            });
            var optionsHTML = generateOptionsHTML(tool);
            toolOptions.innerHTML = optionsHTML;
            toolOptions.classList.remove('hidden');
            setupOptionEventListeners(tool);

            var acceptType = 'default';
            if (pdfTools.includes(tool)) acceptType = 'pdf';
            if (imageTools.includes(tool) || tool === 'imagepdf') acceptType = 'image';
            if (fileAcceptMap[tool]) acceptType = tool;
            fileInput.accept = fileAcceptMap[acceptType] || fileAcceptMap['default'];

            fileInput.multiple = multiFileTools.includes(tool);

            // FIX: Cập nhật hiển thị danh sách tệp dựa trên loại công cụ
            if (fileInput.multiple && selectedFiles.length > 0) {
                fileListContainer.classList.remove('hidden');
                renderFileList();
            } else {
                fileListContainer.classList.add('hidden');
            }

            previewArea.style.display = previewTools.includes(tool) && selectedFiles.length > 0 && selectedFiles[0].type.startsWith('image/') ? 'flex' : 'none';
            updateImagePreview();
            updateWorkspaceState();
        }

        function handleFileSelect(event) {
            var newFiles = Array.from(event.target.files);
            if(fileInput.multiple) { 
                selectedFiles = selectedFiles.concat(newFiles); 
            } else { 
                selectedFiles = newFiles.length > 0 ? [newFiles[0]] : []; 
            }
            
            if (selectedFiles.length === 0) {
                fileNameDisplay.textContent = 'Chưa có tệp nào được chọn';
                fileListContainer.classList.add('hidden');
            } else if (fileInput.multiple) {
                fileNameDisplay.textContent = selectedFiles.length + ' tệp đã được chọn';
                renderFileList();
                fileListContainer.classList.remove('hidden');
            } else {
                fileNameDisplay.textContent = selectedFiles[0].name;
                fileListContainer.classList.add('hidden');
            }
            
            var tool = apiToolSelect.value;
            if (previewTools.includes(tool) && selectedFiles.length > 0 && selectedFiles[0].type.startsWith('image/')) {
                previewArea.style.display = 'flex';
                updateImagePreview();
            } else {
                previewArea.style.display = 'none';
            }
            setStatus('Đã chọn tệp. Sẵn sàng để xử lý.', 'info');
            resultContainer.classList.add('hidden');
            updateWorkspaceState();
        }

        function updateImagePreview() {
            var tool = apiToolSelect.value;
            if (!previewTools.includes(tool) || selectedFiles.length === 0 || !selectedFiles[0].type.startsWith('image/')) {
                previewArea.style.display = 'none';
                updateWorkspaceState();
                return;
            }
            previewArea.style.display = 'flex'; 

            var reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewImage.style.opacity = '1';
                watermarkOverlay.style.cssText = 'position: absolute; display: flex; align-items: center; justify-content: center;';
                cropOverlay.style.cssText = 'position: absolute;';
                previewImage.style.transform = '';
                previewInfo.textContent = '';

                switch(tool) {
                    case 'watermarkimage':
                        var mode = document.getElementById('watermarkMode').value;
                        document.getElementById('watermarkTextInputContainer').style.display = mode === 'text' ? 'block' : 'none';
                        document.getElementById('watermarkImageInputContainer').style.display = mode === 'image' ? 'block' : 'none';
                        document.getElementById('watermarkTextOptions').style.display = mode === 'text' ? 'grid' : 'none';
                        document.getElementById('watermarkImageOptions').style.display = mode === 'image' ? 'grid' : 'none';

                        watermarkOverlay.style.backgroundImage = '';
                        watermarkOverlay.textContent = '';

                        if (mode === 'text') {
                            watermarkOverlay.textContent = document.getElementById('watermarkText').value;
                            watermarkOverlay.style.fontSize = document.getElementById('watermarkFontSize').value + 'px';
                            watermarkOverlay.style.color = document.getElementById('watermarkFontColor').value;
                        } else if (watermarkFile) {
                            var wmReader = new FileReader();
                            wmReader.onload = function(ev) {
                                watermarkOverlay.style.backgroundImage = 'url(' + ev.target.result + ')';
                                watermarkOverlay.style.backgroundSize = 'contain';
                                watermarkOverlay.style.backgroundPosition = 'center';
                                watermarkOverlay.style.backgroundRepeat = 'no-repeat';
                                var scale = document.getElementById('watermarkImageScale').value || 50;
                                watermarkOverlay.style.width = scale + '%';
                                watermarkOverlay.style.height = scale + '%';
                            };
                            wmReader.readAsDataURL(watermarkFile);
                        }
                        
                        var position = document.getElementById('watermarkPosition').value.split('-');
                        watermarkOverlay.style.top = position[0] === 'top' ? '5%' : position[0] === 'bottom' ? 'auto' : '50%';
                        watermarkOverlay.style.bottom = position[0] === 'bottom' ? '5%' : 'auto';
                        watermarkOverlay.style.left = position[1] === 'left' ? '5%' : position[1] === 'right' ? 'auto' : '50%';
                        watermarkOverlay.style.right = position[1] === 'right' ? '5%' : 'auto';
                        watermarkOverlay.style.transform = `translate(${position[1] === 'center' ? '-50%' : '0'}, ${position[0] === 'middle' ? '-50%' : '0'}) rotate(${document.getElementById('watermarkRotation').value}deg)`;
                        watermarkOverlay.style.opacity = document.getElementById('watermarkTransparency').value / 100;
                        break;
                    case 'rotateimage':
                        previewImage.style.transform = `rotate(${document.getElementById('rotateAngle').value}deg)`;
                        break;
                    case 'cropimage':
                        var x = parseInt(document.getElementById('cropX').value) || 0;
                        var y = parseInt(document.getElementById('cropY').value) || 0;
                        var w = parseInt(document.getElementById('cropWidth').value) || 0;
                        var h = parseInt(document.getElementById('cropHeight').value) || 0;
                        cropOverlay.style.left = x + 'px'; cropOverlay.style.top = y + 'px';
                        cropOverlay.style.width = w + 'px'; cropOverlay.style.height = h + 'px';
                        cropOverlay.style.display = (w > 0 && h > 0) ? 'block' : 'none';
                        break;
                    case 'resizeimage':
                        var width = document.getElementById('resizeWidth').value;
                        var height = document.getElementById('resizeHeight').value;
                        if (width || height) { previewInfo.textContent = `Kích thước mới: ${width || 'auto'} x ${height || 'auto'}px`; }
                        break;
                }
            };
            reader.readAsDataURL(selectedFiles[0]);
        }
        
        function handleWatermarkFileSelect(event) { watermarkFile = event.target.files[0]; updateImagePreview(); }
        
        // --- FIX: Render File List with proper Drag and Drop ---
        function renderFileList() {
            fileList.innerHTML = '';
            if (selectedFiles.length === 0) {
                fileListContainer.classList.add('hidden');
                return;
            }

            selectedFiles.forEach(function(file, index) {
                var item = document.createElement('div');
                item.className = 'file-item bg-white p-2 mb-2 rounded border flex justify-between items-center shadow-sm hover:border-indigo-300';
                item.textContent = (index + 1) + ". " + file.name;
                item.draggable = true;
                item.dataset.index = index;
                
                // Drag Events
                item.addEventListener('dragstart', function(e) {
                    item.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', index);
                });

                item.addEventListener('dragend', function() {
                    item.classList.remove('dragging');
                });

                var removeBtn = document.createElement('button');
                removeBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
                removeBtn.className = 'text-red-500 hover:text-red-700 transition-colors ml-4 flex-shrink-0';
                removeBtn.onclick = function() { 
                    selectedFiles.splice(index, 1); 
                    renderFileList(); 
                    fileNameDisplay.textContent = selectedFiles.length > 0 ? selectedFiles.length + ' tệp đã được chọn' : 'Chưa có tệp nào được chọn';
                    updateWorkspaceState();
                };
                
                item.appendChild(removeBtn);
                fileList.appendChild(item);
            });

            // Container drag over logic
            fileList.addEventListener('dragover', function(e) {
                e.preventDefault();
                var afterElement = getDragAfterElement(fileList, e.clientY);
                var draggingItem = document.querySelector('.dragging');
                if (draggingItem) {
                    if (afterElement == null) {
                        fileList.appendChild(draggingItem);
                    } else {
                        fileList.insertBefore(draggingItem, afterElement);
                    }
                }
            });

            fileList.addEventListener('drop', function(e) {
                e.preventDefault();
                // Sắp xếp lại mảng selectedFiles dựa trên thứ tự DOM mới
                var newOrder = [];
                var items = fileList.querySelectorAll('.file-item');
                items.forEach(function(el) {
                    var originalIndex = parseInt(el.dataset.index);
                    newOrder.push(selectedFiles[originalIndex]);
                });
                selectedFiles = newOrder;
                renderFileList(); // Render lại để cập nhật số thứ tự (1, 2, 3...)
            });
        }
        
        function getDragAfterElement(container, y) {
            var draggableElements = [...container.querySelectorAll('.file-item:not(.dragging)')];
            return draggableElements.reduce(function(closest, child) {
                var box = child.getBoundingClientRect();
                var offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; } 
                else { return closest; }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function resetAll() {
            selectedFiles = []; watermarkFile = null; fileInput.value = '';
            var wmInput = document.getElementById('watermarkImageInput'); if(wmInput) wmInput.value = '';
            fileNameDisplay.textContent = 'Chưa có tệp nào được chọn';
            fileListContainer.classList.add('hidden');
            resultContainer.classList.add('hidden');
            previewArea.style.display = 'none';
            setStatus('');
            updateWorkspaceState();
        }

        async function getApiToken(publicKey) {
            var response = await fetch('https://api.ilovepdf.com/v1/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_key: publicKey }) });
            if (!response.ok) throw new Error('Lỗi lấy token xác thực.');
            var data = await response.json();
            return data.token;
        }
        
        async function processFiles() {
            if (selectedFiles.length === 0) { setStatus('Vui lòng chọn ít nhất một tệp.', 'error'); return; }
            showLoader(true);
            resultContainer.classList.add('hidden');
            var publicKey = 'project_public_b518756fab3a8e6942a9330c23a7859a_YUAga5611529e21b17310f7e19ec3547395e1';
            var tool = apiToolSelect.value;
            var apiTool = (tool === 'wordpdf' || tool === 'powerpointpdf' || tool === 'excelpdf') ? 'officepdf' : tool;

            try {
                setStatus('Đang lấy token...', 'info');
                var token = await getApiToken(publicKey);
                var authHeader = 'Bearer ' + token;

                setStatus('Đang khởi tạo tác vụ...', 'info');
                var startResponse = await fetch('https://api.ilovepdf.com/v1/start/' + apiTool, { headers: { 'Authorization': authHeader } });
                if (!startResponse.ok) throw new Error('Lỗi khởi tạo: ' + await startResponse.text());
                var taskData = await startResponse.json();

                var watermarkServerFilename = null;
                if ((apiTool === 'watermark' || apiTool === 'watermarkimage') && document.getElementById('watermarkMode').value === 'image' && watermarkFile) {
                    setStatus('Đang tải lên ảnh dấu...', 'info');
                    var wmFormData = new FormData();
                    wmFormData.append('task', taskData.task);
                    wmFormData.append('file', watermarkFile);
                    var wmUploadResponse = await fetch('https://' + taskData.server + '/v1/upload', { method: 'POST', headers: { 'Authorization': authHeader }, body: wmFormData });
                    if (!wmUploadResponse.ok) throw new Error('Lỗi tải ảnh dấu: ' + await wmUploadResponse.text());
                    var wmUploadData = await wmUploadResponse.json();
                    watermarkServerFilename = wmUploadData.server_filename;
                }

                var serverFilenames = [];
                for (var i = 0; i < selectedFiles.length; i++) {
                    setStatus('Đang tải lên tệp ' + (i + 1) + '/' + selectedFiles.length, 'info');
                    var formData = new FormData();
                    formData.append('task', taskData.task);
                    formData.append('file', selectedFiles[i]);
                    var uploadResponse = await fetch('https://' + taskData.server + '/v1/upload', { method: 'POST', headers: { 'Authorization': authHeader }, body: formData });
                    if (!uploadResponse.ok) throw new Error('Lỗi tải tệp lên: ' + await uploadResponse.text());
                    var uploadData = await uploadResponse.json();
                    serverFilenames.push({ server_filename: uploadData.server_filename, filename: selectedFiles[i].name });
                }

                setStatus('Đang xử lý tệp...', 'info');
                var processBody = { task: taskData.task, tool: apiTool, files: serverFilenames };

                switch(tool) {
                    case 'protect': case 'unlock': processBody.password = document.getElementById('passwordInput').value; break;
                    case 'split': processBody.ranges = document.getElementById('splitRange').value; break;
                    case 'rotate': case 'rotateimage': processBody.rotate = document.getElementById('rotateAngle').value; break;
                    case 'compress': case 'compressimage': processBody.compression_level = document.getElementById('compressionLevel').value; break;
                    case 'convertimage': processBody.output_format = document.getElementById('convertTo').value; break;
                    case 'resizeimage':
                        processBody.resize_mode = "pixels";
                        processBody.pixels_width = document.getElementById('resizeWidth').value;
                        processBody.pixels_height = document.getElementById('resizeHeight').value;
                        processBody.maintain_aspect_ratio = document.getElementById('maintainAspectRatio').checked;
                        break;
                    case 'cropimage':
                        processBody.coordinates = `${document.getElementById('cropX').value},${document.getElementById('cropY').value},${document.getElementById('cropWidth').value},${document.getElementById('cropHeight').value}`;
                        break;
                    case 'watermark': case 'watermarkimage':
                        processBody.mode = document.getElementById('watermarkMode').value;
                        if (processBody.mode === 'text') {
                            processBody.text = document.getElementById('watermarkText').value;
                            processBody.font_size = document.getElementById('watermarkFontSize').value;
                            processBody.font_color = document.getElementById('watermarkFontColor').value;
                        } else if (watermarkServerFilename) {
                            processBody.image = watermarkServerFilename;
                            processBody.scale = document.getElementById('watermarkImageScale').value;
                        }
                        processBody.vertical_position = document.getElementById('watermarkPosition').value.split('-')[0];
                        processBody.horizontal_position = document.getElementById('watermarkPosition').value.split('-')[1];
                        processBody.transparency = document.getElementById('watermarkTransparency').value;
                        processBody.rotation = document.getElementById('watermarkRotation').value;
                        break;
                }
                
                var processResponse = await fetch('https://' + taskData.server + '/v1/process', { method: 'POST', headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify(processBody) });
                if (!processResponse.ok) throw new Error('Lỗi xử lý tệp: ' + await processResponse.text());
                var processData = await processResponse.json();

                if (processData.status === 'TaskSuccess') {
                    setStatus('Xử lý thành công!', 'success');
                    finalDownloadUrl = 'https://' + taskData.server + '/v1/download/' + taskData.task;
                    finalDownloadFilename = processData.download_filename;
                    downloadAuthHeader = authHeader;
                    downloadLink.textContent = 'Tải: ' + finalDownloadFilename;
                    resultContainer.classList.remove('hidden');
                } else {
                    throw new Error('Tác vụ thất bại: ' + (processData.status_text || 'Lỗi không xác định'));
                }
            } catch (error) {
                console.error('API Error:', error);
                setStatus('Lỗi: ' + error.message, 'error');
            } finally {
                showLoader(false);
            }
        }

        async function downloadResult(event) {
            event.preventDefault();
            if (!finalDownloadUrl) return;
            setStatus('Đang tải tệp về...', 'info');
            try {
                var response = await fetch(finalDownloadUrl, { headers: { 'Authorization': downloadAuthHeader } });
                if (!response.ok) throw new Error('Lỗi khi tải tệp.');
                var blob = await response.blob();
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = finalDownloadFilename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                setStatus('Tải tệp thành công!', 'success');
            } catch (error) {
                setStatus('Lỗi khi tải về: ' + error.message, 'error');
            }
        }
        
        // --- Init ---
        window.addEventListener('load', function() {
            updateUiForTool();
        });
